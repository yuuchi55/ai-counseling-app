const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

// Rate limiter configurations
const generalRateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 * 5, // Block for 5 minutes
});

const strictRateLimiter = new RateLimiterMemory({
  points: 5, // Number of requests
  duration: 60 * 15, // Per 15 minutes
  blockDuration: 60 * 60, // Block for 1 hour
});

// Request rate limiting middleware
const rateLimiterMiddleware = (limiter = generalRateLimiter) => {
  return async (req, res, next) => {
    try {
      const key = req.ip || req.connection.remoteAddress;
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60
      });
    }
  };
};

// SQL injection protection for query parameters
const preventSQLInjection = (req, res, next) => {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\bOR\b\s*\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s*\d+\s*=\s*\d+)/gi,
    /(\'|\"|;|\\)/g
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  // Check query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (checkValue(value)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters detected'
      });
    }
  }

  // Check body parameters
  if (req.body && typeof req.body === 'object') {
    const checkObject = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (checkObject(value)) return true;
        } else if (checkValue(value)) {
          return true;
        }
      }
      return false;
    };

    if (checkObject(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body detected'
      });
    }
  }

  next();
};

// Session security configuration
const sessionSecurity = {
  secret: process.env.SESSION_SECRET || require('crypto').randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'strict' // CSRF protection
  },
  name: 'sessionId' // Change default session name
};

// IP blocking middleware
const blockedIPs = new Set();

const ipBlocker = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }
  
  next();
};

// Add IP to blocklist
const blockIP = (ip) => {
  blockedIPs.add(ip);
  
  // Auto-unblock after 24 hours
  setTimeout(() => {
    blockedIPs.delete(ip);
  }, 24 * 60 * 60 * 1000);
};

// Security audit logging
const securityAuditLog = (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    userId: req.user?.userId || 'anonymous'
  };
  
  // Log security-relevant events
  if (req.method !== 'GET' || req.url.includes('/auth/')) {
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));
  }
  
  next();
};

// Content type validation
const validateContentType = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const contentType = req.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported media type. Please use application/json'
      });
    }
  }
  
  next();
};

// Request size limiting
const requestSizeLimit = {
  json: '10mb',
  urlencoded: { extended: true, limit: '10mb' }
};

// File upload security
const fileUploadSecurity = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 10, // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
};

module.exports = {
  securityHeaders,
  corsOptions,
  rateLimiterMiddleware,
  strictRateLimiter,
  preventSQLInjection,
  sessionSecurity,
  ipBlocker,
  blockIP,
  securityAuditLog,
  validateContentType,
  requestSizeLimit,
  fileUploadSecurity,
  mongoSanitize,
  xss,
  hpp,
  cors
};