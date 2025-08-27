const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const SALT_ROUNDS = 12;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// Generate encryption key from password
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
};

// Encrypt sensitive data
const encrypt = (text, masterKey = process.env.ENCRYPTION_KEY) => {
  if (!masterKey) {
    throw new Error('Encryption key is not configured');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from master key and salt
  const key = deriveKey(masterKey, salt);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag();
  
  // Combine salt, iv, authTag, and encrypted data
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]);
  
  return combined.toString('base64');
};

// Decrypt sensitive data
const decrypt = (encryptedData, masterKey = process.env.ENCRYPTION_KEY) => {
  if (!masterKey) {
    throw new Error('Encryption key is not configured');
  }

  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  // Derive key from master key and salt
  const key = deriveKey(masterKey, salt);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt the data
  let decrypted = decipher.update(encrypted, null, 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Hash password with bcrypt
const hashPassword = async (password) => {
  // Add password strength validation
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new Error('Password is too common. Please choose a stronger password');
  }
  
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Verify password with bcrypt
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate OTP (One Time Password)
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, digits.length);
    otp += digits[randomIndex];
  }
  
  return otp;
};

// Hash token for storage (one-way hash)
const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// Encrypt personal data fields
const encryptPersonalData = (data) => {
  const sensitiveFields = ['email', 'phone', 'address', 'ssn', 'creditCard', 'counselingNotes'];
  const encryptedData = { ...data };
  
  for (const field of sensitiveFields) {
    if (encryptedData[field]) {
      encryptedData[field] = encrypt(encryptedData[field]);
      encryptedData[`${field}_encrypted`] = true;
    }
  }
  
  return encryptedData;
};

// Decrypt personal data fields
const decryptPersonalData = (data) => {
  const decryptedData = { ...data };
  
  for (const key in decryptedData) {
    if (key.endsWith('_encrypted') && decryptedData[key] === true) {
      const fieldName = key.replace('_encrypted', '');
      if (decryptedData[fieldName]) {
        try {
          decryptedData[fieldName] = decrypt(decryptedData[fieldName]);
          delete decryptedData[key];
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldName}:`, error.message);
        }
      }
    }
  }
  
  return decryptedData;
};

// Generate HMAC signature
const generateHMAC = (data, secret = process.env.HMAC_SECRET) => {
  if (!secret) {
    throw new Error('HMAC secret is not configured');
  }
  
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
};

// Verify HMAC signature
const verifyHMAC = (data, signature, secret = process.env.HMAC_SECRET) => {
  if (!secret) {
    throw new Error('HMAC secret is not configured');
  }
  
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

// Anonymize data for analytics
const anonymizeData = (data) => {
  const anonymized = { ...data };
  
  // Hash identifiable information
  if (anonymized.userId) {
    anonymized.userId = hashToken(anonymized.userId);
  }
  
  if (anonymized.email) {
    const [localPart, domain] = anonymized.email.split('@');
    anonymized.email = `${localPart.substring(0, 2)}***@${domain}`;
  }
  
  if (anonymized.ip) {
    const parts = anonymized.ip.split('.');
    if (parts.length === 4) {
      anonymized.ip = `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
  }
  
  return anonymized;
};

// Password strength checker
const checkPasswordStrength = (password) => {
  const strength = {
    score: 0,
    feedback: []
  };
  
  // Length check
  if (password.length >= 8) strength.score++;
  if (password.length >= 12) strength.score++;
  if (password.length >= 16) strength.score++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength.score++;
  if (/[A-Z]/.test(password)) strength.score++;
  if (/[0-9]/.test(password)) strength.score++;
  if (/[^a-zA-Z0-9]/.test(password)) strength.score++;
  
  // Common patterns check
  if (!/(.)\1{2,}/.test(password)) strength.score++; // No repeated characters
  if (!/12345|qwerty|password/i.test(password)) strength.score++; // No common patterns
  
  // Generate feedback
  if (password.length < 8) {
    strength.feedback.push('Password should be at least 8 characters');
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    strength.feedback.push('Include both uppercase and lowercase letters');
  }
  if (!/[0-9]/.test(password)) {
    strength.feedback.push('Include at least one number');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    strength.feedback.push('Include at least one special character');
  }
  
  // Calculate strength level
  if (strength.score >= 8) {
    strength.level = 'strong';
  } else if (strength.score >= 5) {
    strength.level = 'medium';
  } else {
    strength.level = 'weak';
  }
  
  return strength;
};

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  generateOTP,
  hashToken,
  encryptPersonalData,
  decryptPersonalData,
  generateHMAC,
  verifyHMAC,
  anonymizeData,
  checkPasswordStrength
};