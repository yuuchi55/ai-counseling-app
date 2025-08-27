// Security Configuration for AI Counseling System
module.exports = {
  // Authentication settings
  auth: {
    jwt: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      algorithm: 'HS256',
      issuer: 'ai-counseling-system',
      audience: 'ai-counseling-users'
    },
    session: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict'
    },
    password: {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      bcryptRounds: 12,
      preventCommon: true,
      preventUserInfo: true
    },
    mfa: {
      enabled: true,
      otpLength: 6,
      otpExpiry: 300000, // 5 minutes
      backupCodesCount: 10
    }
  },

  // Rate limiting settings
  rateLimiting: {
    global: {
      windowMs: 60000, // 1 minute
      maxRequests: 100
    },
    auth: {
      windowMs: 900000, // 15 minutes
      maxRequests: 5
    },
    api: {
      windowMs: 60000, // 1 minute
      maxRequests: 60
    },
    counseling: {
      windowMs: 60000, // 1 minute
      maxRequests: 30
    }
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: {
      iterations: 100000,
      keyLength: 32,
      digest: 'sha256'
    },
    personalDataFields: [
      'email',
      'phone',
      'address',
      'dateOfBirth',
      'counselingNotes',
      'medicalHistory',
      'emergencyContact'
    ]
  },

  // CORS settings
  cors: {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token',
      'X-Session-ID'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Remaining'],
    maxAge: 86400 // 24 hours
  },

  // Security headers
  headers: {
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // File upload settings
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'audio/mp3',
      'audio/wav'
    ],
    scanForViruses: true,
    storageEncrypted: true
  },

  // Database security
  database: {
    connectionTimeout: 10000,
    maxPoolSize: 10,
    enableSSL: process.env.NODE_ENV === 'production',
    sanitizeQueries: true,
    auditLog: true
  },

  // API security
  api: {
    requireApiKey: true,
    apiKeyLength: 32,
    apiKeyRotation: 90, // days
    requireHttps: process.env.NODE_ENV === 'production',
    requestSizeLimit: '10mb',
    responseTimeout: 30000 // 30 seconds
  },

  // Session security
  sessionSecurity: {
    counselingSession: {
      maxDuration: 120 * 60 * 1000, // 2 hours
      inactivityTimeout: 15 * 60 * 1000, // 15 minutes
      recordingEncrypted: true,
      endToEndEncryption: true
    },
    userSession: {
      maxConcurrent: 3,
      deviceFingerprinting: true,
      ipValidation: true,
      geoLocationCheck: true
    }
  },

  // Audit and logging
  audit: {
    enabled: true,
    logLevel: 'info',
    sensitiveDataMasking: true,
    retentionDays: 90,
    events: [
      'auth.login',
      'auth.logout',
      'auth.failed',
      'data.access',
      'data.modify',
      'data.delete',
      'session.start',
      'session.end',
      'payment.process',
      'security.violation'
    ]
  },

  // Privacy settings
  privacy: {
    dataMinimization: true,
    anonymizeAnalytics: true,
    consentRequired: true,
    gdprCompliant: true,
    dataRetention: {
      counselingRecords: 365 * 7, // 7 years
      userProfiles: 365 * 3, // 3 years
      sessionLogs: 90, // days
      analyticsData: 365 // 1 year
    },
    rightToErasure: true,
    dataPortability: true
  },

  // Security monitoring
  monitoring: {
    intrussionDetection: true,
    anomalyDetection: true,
    realTimeAlerts: true,
    suspiciousPatterns: [
      'multiple_failed_logins',
      'unusual_access_pattern',
      'data_exfiltration_attempt',
      'privilege_escalation',
      'sql_injection',
      'xss_attempt'
    ],
    blockThresholds: {
      failedLogins: 5,
      suspiciousRequests: 10,
      rateLimitViolations: 3
    }
  },

  // Backup and recovery
  backup: {
    enabled: true,
    frequency: 'daily',
    encryption: true,
    offsite: true,
    retention: 30, // days
    testRecovery: 'monthly'
  },

  // Compliance
  compliance: {
    standards: ['HIPAA', 'GDPR', 'ISO27001'],
    certifications: ['SOC2'],
    auditFrequency: 'quarterly',
    penetrationTesting: 'annually',
    vulnerabilityScanning: 'weekly'
  },

  // Emergency procedures
  emergency: {
    dataBreachProtocol: true,
    incidentResponseTeam: true,
    communicationPlan: true,
    recoveryTimeObjective: 4, // hours
    recoveryPointObjective: 24 // hours
  }
};