const { body, param, query } = require('express-validator');

// User registration validation
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('パスワードは8文字以上である必要があります')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは小文字、大文字、数字を含む必要があります'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('ユーザー名は3文字以上30文字以下である必要があります')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名前は1文字以上50文字以下である必要があります'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓は1文字以上50文字以下である必要があります')
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('パスワードを入力してください')
];

// Password reset request validation
const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail()
];

// Password reset validation
const validatePasswordReset = [
  param('token')
    .notEmpty()
    .withMessage('トークンが必要です'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('パスワードは8文字以上である必要があります')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは小文字、大文字、数字を含む必要があります')
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('現在のパスワードを入力してください'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('新しいパスワードは8文字以上である必要があります')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('パスワードは小文字、大文字、数字を含む必要があります')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('新しいパスワードは現在のパスワードと異なる必要があります')
];

// Update profile validation
const validateUpdateProfile = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('ユーザー名は3文字以上30文字以下である必要があります')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます'),
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名前は1文字以上50文字以下である必要があります'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓は1文字以上50文字以下である必要があります'),
  body('profile.bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('自己紹介は500文字以下である必要があります'),
  body('profile.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('有効な日付形式を入力してください'),
  body('profile.phoneNumber')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('有効な電話番号を入力してください'),
  body('preferences.language')
    .optional()
    .isIn(['ja', 'en'])
    .withMessage('サポートされている言語を選択してください'),
  body('preferences.timezone')
    .optional()
    .isIn(['Asia/Tokyo', 'UTC', 'America/New_York', 'Europe/London'])
    .withMessage('有効なタイムゾーンを選択してください')
];

// Delete account validation
const validateDeleteAccount = [
  body('password')
    .notEmpty()
    .withMessage('パスワードを入力してください')
];

// Email verification validation
const validateEmailVerification = [
  param('token')
    .notEmpty()
    .withMessage('確認トークンが必要です')
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateUpdateProfile,
  validateDeleteAccount,
  validateEmailVerification
};