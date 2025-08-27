const authService = require('../services/authService');
const { validationResult } = require('express-validator');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const result = await authService.register(req.body);

      // Set cookies
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.status(201).json({
        success: true,
        message: '登録が完了しました',
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Set cookies
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        message: 'ログインしました',
        data: {
          user: result.user,
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await authService.logout(req.user.userId, refreshToken);
      }

      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'ログアウトしました'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Logout from all devices
  async logoutAll(req, res) {
    try {
      await authService.logoutAll(req.user.userId);
      
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'すべてのデバイスからログアウトしました'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Refresh access token
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'リフレッシュトークンが必要です'
        });
      }

      const result = await authService.refreshAccessToken(refreshToken);

      // Update refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'トークンが必要です'
        });
      }

      const result = await authService.verifyEmail(token);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Request password reset
  async requestPasswordReset(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const result = await authService.requestPasswordReset(email);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { token } = req.params;
      const { password } = req.body;
      
      const result = await authService.resetPassword(token, password);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await authService.getUserProfile(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const user = await authService.updateUserProfile(userId, req.body);
      
      res.json({
        success: true,
        message: 'プロフィールが更新されました',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete account
  async deleteAccount(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.userId;
      const { password } = req.body;
      
      const result = await authService.deleteAccount(userId, password);
      
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check authentication status
  async checkAuth(req, res) {
    try {
      const userId = req.user.userId;
      const user = await authService.getUserProfile(userId);
      
      res.json({
        success: true,
        authenticated: true,
        data: user
      });
    } catch (error) {
      res.json({
        success: false,
        authenticated: false,
        message: error.message
      });
    }
  }
}

module.exports = new AuthController();