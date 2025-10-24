/**
 * Security Headers Middleware
 * Implements OWASP best practices for HTTP security headers
 * Protects against XSS, clickjacking, and other attacks
 */

import express from 'express';

export function securityHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Prevent clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter in browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy (privacy)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (restrict browser features)
  res.setHeader('Permissions-Policy', 
    'camera=(self), microphone=(self), geolocation=(), payment=()'
  );
  
  // Content Security Policy (XSS protection)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.bumpin.com wss://api.bumpin.com https://*.cloudflare.com https://*.railway.app wss://*.railway.app",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // Strict Transport Security (HSTS) - Only in production over HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  next();
}

/**
 * HTTPS Redirect (Production Only)
 * Redirect all HTTP traffic to HTTPS
 */
export function httpsRedirect(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.NODE_ENV === 'production') {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    
    if (protocol !== 'https') {
      console.log(`[Security] Redirecting HTTP → HTTPS: ${req.url}`);
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  
  next();
}

/**
 * Request logging with security context
 */
export function securityLogger(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  // Log all requests (for audit trail)
  console.log('[Request]', {
    method: req.method,
    path: req.path,
    ip,
    userAgent: userAgent?.substring(0, 50)
  });
  
  next();
}

