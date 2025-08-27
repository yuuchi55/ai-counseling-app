const { body, query, param, validationResult } = require('express-validator');
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

// Enhanced validation middleware with detailed error messages
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    
    return res.status(400).json({ 
      success: false,
      errors: formattedErrors,
      message: 'Validation failed'
    });
  }
  next();
};

// Sanitize input to prevent XSS
const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    // Remove HTML tags and dangerous characters
    value = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
    // Trim whitespace
    value = value.trim();
    // Escape special characters
    value = validator.escape(value);
  }
  return value;
};

// Custom validators
const customValidators = {
  isStrongPassword: (value) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    
    return (
      value.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  },
  
  isValidUsername: (value) => {
    // Username: 3-20 chars, alphanumeric, underscore, hyphen
    return /^[a-zA-Z0-9_-]{3,20}$/.test(value);
  },
  
  isValidPhoneNumber: (value) => {
    // Japanese phone number format
    return /^(\+81|0)\d{1,4}-?\d{1,4}-?\d{4}$/.test(value.replace(/\s/g, ''));
  },
  
  noSQLInjection: (value) => {
    // Check for common SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi,
      /(--|#|\/\*|\*\/)/g,
      /(\bOR\b\s*\d+\s*=\s*\d+)/gi
    ];
    
    return !sqlPatterns.some(pattern => pattern.test(value));
  },
  
  noScriptInjection: (value) => {
    // Check for script injection attempts
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    return !scriptPatterns.some(pattern => pattern.test(value));
  },
  
  noNoSQLInjection: (value) => {
    // Check for NoSQL injection patterns
    const noSqlPatterns = [
      /\$where/gi,
      /\$ne/gi,
      /\$gt/gi,
      /\$lt/gi,
      /\$regex/gi
    ];
    
    return !noSqlPatterns.some(pattern => pattern.test(JSON.stringify(value)));
  }
};

// Input sanitization middleware
const sanitizeBody = (fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field]) {
          req.body[field] = sanitizeInput(req.body[field]);
        }
      });
    }
    next();
  };
};

// Advanced registration validation
const validateAdvancedRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('メールアドレスが長すぎます')
    .custom(customValidators.noSQLInjection)
    .withMessage('無効な文字が含まれています'),
    
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('パスワードは8文字以上128文字以下である必要があります')
    .custom(customValidators.isStrongPassword)
    .withMessage('パスワードは大文字、小文字、数字、特殊文字を含む必要があります')
    .custom((value, { req }) => {
      // Check if password contains username or email
      const username = req.body.username?.toLowerCase();
      const email = req.body.email?.split('@')[0]?.toLowerCase();
      const passwordLower = value.toLowerCase();
      
      if (username && passwordLower.includes(username)) {
        throw new Error('パスワードにユーザー名を含めることはできません');
      }
      if (email && passwordLower.includes(email)) {
        throw new Error('パスワードにメールアドレスの一部を含めることはできません');
      }
      return true;
    }),
    
  body('username')
    .trim()
    .custom(customValidators.isValidUsername)
    .withMessage('ユーザー名は3-20文字の英数字、ハイフン、アンダースコアのみ使用できます')
    .custom(customValidators.noSQLInjection)
    .withMessage('無効な文字が含まれています')
    .custom(customValidators.noScriptInjection)
    .withMessage('無効な文字が含まれています'),
    
  body('agreeToTerms')
    .isBoolean()
    .equals('true')
    .withMessage('利用規約に同意する必要があります'),
    
  body('captchaToken')
    .notEmpty()
    .withMessage('CAPTCHAの確認が必要です'),
    
  validate
];

// Counseling message validation
const validateCounselingMessage = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('メッセージを入力してください')
    .isLength({ min: 1, max: 5000 })
    .withMessage('メッセージは1文字以上5000文字以内で入力してください')
    .customSanitizer(sanitizeInput)
    .custom(customValidators.noScriptInjection)
    .withMessage('無効な文字が含まれています'),
    
  body('sessionId')
    .notEmpty()
    .withMessage('セッションIDが必要です')
    .isMongoId()
    .withMessage('無効なセッションIDです'),
    
  body('attachments')
    .optional()
    .isArray({ max: 5 })
    .withMessage('添付ファイルは5個までです'),
    
  body('attachments.*.fileType')
    .optional()
    .isIn(['image/jpeg', 'image/png', 'image/gif', 'application/pdf'])
    .withMessage('サポートされていないファイル形式です'),
    
  body('attachments.*.fileSize')
    .optional()
    .isInt({ max: 5242880 }) // 5MB
    .withMessage('ファイルサイズは5MB以下にしてください'),
    
  validate
];

// Session booking validation
const validateSessionBooking = [
  body('counselorId')
    .notEmpty()
    .withMessage('カウンセラーを選択してください')
    .isMongoId()
    .withMessage('無効なカウンセラーIDです'),
    
  body('date')
    .notEmpty()
    .withMessage('日付を選択してください')
    .isISO8601()
    .withMessage('無効な日付形式です')
    .custom((value) => {
      const selectedDate = new Date(value);
      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setMonth(maxFutureDate.getMonth() + 3); // 3 months ahead
      
      if (selectedDate <= now) {
        throw new Error('過去の日付は選択できません');
      }
      if (selectedDate > maxFutureDate) {
        throw new Error('3ヶ月以上先の日付は選択できません');
      }
      return true;
    }),
    
  body('duration')
    .isInt({ min: 30, max: 120 })
    .withMessage('セッション時間は30分から120分の間で選択してください'),
    
  body('type')
    .isIn(['video', 'voice', 'chat'])
    .withMessage('無効なセッションタイプです'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('備考は1000文字以内で入力してください')
    .customSanitizer(sanitizeInput),
    
  validate
];

// Advanced search query validation
const validateAdvancedSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('検索クエリは1文字以上100文字以内で入力してください')
    .customSanitizer(sanitizeInput)
    .custom(customValidators.noSQLInjection)
    .withMessage('無効な文字が含まれています'),
    
  query('category')
    .optional()
    .isIn(['counselor', 'article', 'session', 'resource'])
    .withMessage('無効なカテゴリです'),
    
  query('sortBy')
    .optional()
    .isIn(['relevance', 'date', 'rating', 'price'])
    .withMessage('無効なソート条件です'),
    
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('無効な並び順です'),
    
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('無効なページ番号です'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('無効な表示件数です'),
    
  query('filters')
    .optional()
    .custom((value) => {
      try {
        const filters = JSON.parse(value);
        return customValidators.noNoSQLInjection(filters);
      } catch {
        throw new Error('無効なフィルター形式です');
      }
    }),
    
  validate
];

// API key validation
const validateAPIKey = [
  param('apiKey')
    .notEmpty()
    .withMessage('APIキーが必要です')
    .isLength({ min: 32, max: 64 })
    .withMessage('無効なAPIキー形式です')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('APIキーに無効な文字が含まれています'),
    
  validate
];

// Rate limiting check
const checkRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key).filter(time => now - time < windowMs);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'リクエスト数が多すぎます。しばらく待ってから再度お試しください',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [ip, times] of requests.entries()) {
        const validTimes = times.filter(time => now - time < windowMs);
        if (validTimes.length === 0) {
          requests.delete(ip);
        } else {
          requests.set(ip, validTimes);
        }
      }
    }
    
    next();
  };
};

module.exports = {
  validate,
  sanitizeInput,
  customValidators,
  sanitizeBody,
  validateAdvancedRegister,
  validateCounselingMessage,
  validateSessionBooking,
  validateAdvancedSearch,
  validateAPIKey,
  checkRateLimit
};