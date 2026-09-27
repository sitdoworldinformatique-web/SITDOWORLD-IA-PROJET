/**
 * SITDOWORLD AI MUSIC - Backend Private Secrets
 * 
 * CRITICAL SECURITY NOTICE:
 * This module is STRICTLY SERVER-SIDE.
 * None of the keys or secrets defined here are exposed to the frontend or browser.
 */

// Private 32-character backend secret provided for SASPAY / SaaS backend operations
export const BACKEND_PRIVATE_SECRET =
  process.env.BACKEND_SECRET_KEY || 'f445f022c338041f353d25ccf0233643';

// SASPAY Gateway Private Secret & Merchant Key
export const SASPAY_SECRET_KEY =
  process.env.SASPAY_SECRET_KEY ||
  process.env.SASPAY_SECRET ||
  'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg';

export const SASPAY_API_KEY =
  process.env.SASPAY_SECRET_KEY ||
  process.env.SASPAY_API_KEY ||
  process.env.SASPAY_KEY ||
  'sk_live_CF7e31LlcQjfRMdmPDbM2UtTmT__FQHsVsXvauez5qg';

// SASPAY Webhook Signing Secret (for HMAC-SHA256 callback verification)
export const SASPAY_WEBHOOK_SECRET =
  process.env.SASPAY_WEBHOOK_SECRET ||
  'ce1cbaf1598a05c29cb316f2058b3ab793e8626ec44899e733868ff5a0649847';

// SUNO / SUNOR AI Music Provider API Key (Server-side only)
export const SUNO_API_KEY = process.env.SUNO_API_KEY || process.env.SUNOR_API_KEY || '';
export const SUNOR_API_KEY = process.env.SUNO_API_KEY || process.env.SUNOR_API_KEY || '';

// Private Auth Token Secret
export const AUTH_PRIVATE_SECRET =
  process.env.AUTH_SECRET || 'f445f022c338041f353d25ccf0233643';
