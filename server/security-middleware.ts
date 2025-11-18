import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    // Store failed attempts in memory (consider Redis for production scaling)
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later'
);

export const apiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  500, // 500 requests per minute (increased for development)
  'Too many requests, please try again later'
);

export const strictApiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  100, // 100 requests per minute for sensitive operations (increased)
  'Rate limit exceeded for sensitive operations'
);

// Security headers middleware - environment-aware CSP
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for Replit functionality
});

// Input sanitization middleware
export const sanitizeInput = [
  body('*').trim().escape(), // Basic XSS protection
];

// Validation error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Invalid input data',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: 'Invalid input detected'
      }))
    });
  }
  next();
};

// Enhanced error handler that doesn't leak sensitive information
export const secureErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Categorize different types of errors
  const isDatabaseError = err.message?.includes('terminating connection due to administrator command') ||
                          err.message?.includes('connection terminated') ||
                          err.code === '57P01' ||
                          err.code === 'ECONNRESET';
  
  const isValidationError = err.name === 'ValidationError' || err.status === 400;
  const isAuthError = err.status === 401 || err.status === 403;
  
  // Log appropriately based on error type
  if (isDatabaseError) {
    console.warn('Database Connection Error (will retry):', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method
    });
  } else if (isValidationError || isAuthError) {
    console.log('Client Error:', {
      error: err.message,
      status: err.status,
      path: req.path,
      method: req.method
    });
  } else {
    // Only log as security error for unexpected server errors
    console.error('Server Error:', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  let message = 'An error occurred while processing your request';
  
  if (isDevelopment) {
    message = err.message;
  } else if (isDatabaseError) {
    message = 'Database temporarily unavailable, please try again';
  } else if (isValidationError) {
    message = 'Invalid request data';
  } else if (isAuthError) {
    message = 'Authentication required';
  }
  
  const statusCode = err.status || err.statusCode || (isDatabaseError ? 503 : 500);
  
  res.status(statusCode).json({
    error: statusCode < 500 ? message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Security event logger
export const logSecurityEvent = (event: string, details: any) => {
  console.warn(`SECURITY EVENT: ${event}`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Audit logging middleware for sensitive operations
export const auditLogger = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    logSecurityEvent('AUDIT_LOG', {
      operation,
      userId: user?.claims?.sub || 'anonymous',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    next();
  };
};