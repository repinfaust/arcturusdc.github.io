/**
 * Simple in-memory rate limiter
 *
 * For production with multiple servers, use @upstash/ratelimit with Redis.
 * This implementation works for single-server or serverless environments.
 */

const rateLimitStore = new Map();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.resetAt > 0) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check if request should be rate limited
 *
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(identifier, maxRequests, windowMs) {
  const now = Date.now();
  const key = identifier;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  const data = rateLimitStore.get(key);

  // Reset if window has passed
  if (now > data.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  data.count++;
  rateLimitStore.set(key, data);

  const allowed = data.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - data.count);

  return {
    allowed,
    remaining,
    resetAt: data.resetAt,
  };
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request) {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback
  return 'unknown-ip';
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Public endpoints - stricter limits
  publicTestAccess: {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  publicTestSubmit: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Authenticated endpoints - more lenient
  authenticatedAction: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
};
