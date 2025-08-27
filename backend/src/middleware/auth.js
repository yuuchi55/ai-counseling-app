const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '認証トークンが必要です'
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: '無効なトークンタイプです'
      });
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'アカウントが無効になっています'
      });
    }

    // Attach user to request
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '無効なトークンです'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'トークンの有効期限が切れています'
      });
    }

    res.status(500).json({
      success: false,
      message: '認証エラーが発生しました'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'access') {
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          userId: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
    }
  } catch (error) {
    // Silent fail - continue without authentication
  }
  
  next();
};

// Check if user has required role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'この操作を実行する権限がありません'
      });
    }

    next();
  };
};

// Check if email is verified
const requireEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ユーザーが見つかりません'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'メールアドレスの確認が必要です'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'エラーが発生しました'
    });
  }
};

// Rate limiting for authentication endpoints
const authRateLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'リクエスト数が多すぎます。しばらく待ってから再度お試しください',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'リクエスト数が多すぎます。しばらく待ってから再度お試しください'
    });
  },
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  }
});

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireEmailVerification,
  authRateLimiter
};