const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('./emailService');

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );
  }

  // Verify token
  verifyToken(token, isRefreshToken = false) {
    const secret = isRefreshToken ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
    return jwt.verify(token, secret);
  }

  // Register new user
  async register(userData) {
    const { email, password, username, firstName, lastName } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('このメールアドレスは既に登録されています');
      }
      if (existingUser.username === username) {
        throw new Error('このユーザー名は既に使用されています');
      }
    }

    // Create new user
    const user = new User({
      email,
      password,
      username,
      profile: {
        firstName,
        lastName
      }
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    // Generate tokens
    const accessToken = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  // Login user
  async login(email, password) {
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new Error('アカウントがロックされています。しばらく待ってから再度お試しください');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('アカウントが無効になっています');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw new Error('メールアドレスまたはパスワードが正しくありません');
    }

    // Reset login attempts and update last login
    await user.resetLoginAttempts();
    user.lastLogin = Date.now();

    // Clean expired tokens
    user.cleanExpiredTokens();

    // Generate tokens
    const accessToken = this.generateToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  // Logout user
  async logout(userId, refreshToken) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // Remove refresh token
    user.refreshTokens = user.refreshTokens.filter(
      tokenObj => tokenObj.token !== refreshToken
    );
    await user.save();

    return { message: 'ログアウトしました' };
  }

  // Logout from all devices
  async logoutAll(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // Remove all refresh tokens
    user.refreshTokens = [];
    await user.save();

    return { message: 'すべてのデバイスからログアウトしました' };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken, true);
      
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      // Check if refresh token exists in database
      const tokenExists = user.refreshTokens.some(
        tokenObj => tokenObj.token === refreshToken
      );

      if (!tokenExists) {
        throw new Error('無効なリフレッシュトークンです');
      }

      // Clean expired tokens
      user.cleanExpiredTokens();

      // Generate new access token
      const newAccessToken = this.generateToken(user._id);

      // Optionally generate new refresh token (rotation)
      const newRefreshToken = this.generateRefreshToken(user._id);
      
      // Remove old refresh token and add new one
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj.token !== refreshToken
      );
      user.refreshTokens.push({ token: newRefreshToken });
      await user.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('トークンの更新に失敗しました');
    }
  }

  // Verify email
  async verifyEmail(token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('無効または期限切れのトークンです');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'メールアドレスが確認されました' };
  }

  // Request password reset
  async requestPasswordReset(email) {
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if user exists
      return { message: 'パスワードリセット用のメールを送信しました（該当するアカウントが存在する場合）' };
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'パスワードリセット用のメールを送信しました' };
  }

  // Reset password
  async resetPassword(token, newPassword) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new Error('無効または期限切れのトークンです');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangeConfirmation(user.email);

    return { message: 'パスワードがリセットされました' };
  }

  // Change password (for logged-in users)
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      throw new Error('現在のパスワードが正しくありません');
    }

    // Update password
    user.password = newPassword;
    
    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangeConfirmation(user.email);

    return { message: 'パスワードが変更されました' };
  }

  // Get user profile
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    return user.toJSON();
  }

  // Update user profile
  async updateUserProfile(userId, updates) {
    const allowedUpdates = ['profile', 'preferences', 'username'];
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // Check if username is being updated and is unique
    if (updates.username && updates.username !== user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        throw new Error('このユーザー名は既に使用されています');
      }
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'profile' || key === 'preferences') {
          Object.assign(user[key], updates[key]);
        } else {
          user[key] = updates[key];
        }
      }
    });

    await user.save();
    return user.toJSON();
  }

  // Delete user account
  async deleteAccount(userId, password) {
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('パスワードが正しくありません');
    }

    // Soft delete (mark as inactive)
    user.isActive = false;
    user.refreshTokens = [];
    await user.save();

    // Optionally, schedule hard delete after 30 days
    // await scheduleAccountDeletion(userId);

    return { message: 'アカウントが削除されました' };
  }
}

module.exports = new AuthService();