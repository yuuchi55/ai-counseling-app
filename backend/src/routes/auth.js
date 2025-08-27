const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authRateLimiter, requireEmailVerification } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateUpdateProfile,
  validateDeleteAccount,
  validateEmailVerification
} = require('../middleware/validation');

// Public routes
router.post('/register', authRateLimiter, validateRegister, authController.register);
router.post('/login', authRateLimiter, validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', validateEmailVerification, authController.verifyEmail);
router.post('/password-reset', authRateLimiter, validatePasswordResetRequest, authController.requestPasswordReset);
router.post('/password-reset/:token', authRateLimiter, validatePasswordReset, authController.resetPassword);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', validateUpdateProfile, authController.updateProfile);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/change-password', validateChangePassword, authController.changePassword);
router.delete('/account', validateDeleteAccount, authController.deleteAccount);
router.get('/check', authController.checkAuth);

// Protected routes that require email verification
router.get('/protected-resource', requireEmailVerification, (req, res) => {
  res.json({
    success: true,
    message: 'このリソースにアクセスできます',
    user: req.user
  });
});

module.exports = router;