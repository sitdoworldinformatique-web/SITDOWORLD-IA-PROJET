/**
 * SITDOWORLD AI MUSIC - SASPAY Outgoing Request Logger & Redaction Helper
 *
 * Provides safe HTTP fetching and structured logging for all outgoing calls
 * to the Saspay API, ensuring that API keys, Bearer tokens, secrets, and
 * sensitive customer credentials are permanently redacted from application logs.
 */

import { SASPAY_SECRET_KEY, SASPAY_API_KEY, SASPAY_WEBHOOK_SECRET } from './secrets';

export interface SaspayOutgoingLogEntry {
  id: string;
  timestamp: string;
  durationMs: number;
  label?: string;
  transactionReference?: string;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    payload: any;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    rawBody: string;
    parsedBody?: any;
  };
  error?: string;
}

// Known secrets to always redact
const KNOWN_SECRETS = Array.from(
  new Set(
    [
      SASPAY_SECRET_KEY,
      SASPAY_API_KEY,
      SASPAY_WEBHOOK_SECRET,
      process.env.SASPAY_SECRET_KEY,
      process.env.SASPAY_API_KEY,
      process.env.SASPAY_WEBHOOK_SECRET,
      process.env.BACKEND_SECRET_KEY,
    ].filter((s): s is string => typeof s === 'string' && s.trim().length > 4)
  )
);

// Sensitive key name patterns (case-insensitive)
const SENSITIVE_KEY_REGEX = /^(authorization|x-api-key|api-key|apikey|api_key|secret|secret_key|secretkey|webhook_secret|password|pin|cvv|token|access_token|refresh_token|bearer|private_key|auth)$/i;

// Regex patterns for sensitive tokens in strings
const BEARER_TOKEN_REGEX = /Bearer\s+([A-Za-z0-9_\-\.]+)/gi;
const SK_LIVE_REGEX = /sk_(live|test)_[a-zA-Z0-9_\-]+/gi;
const PK_LIVE_REGEX = /pk_(live|test)_[a-zA-Z0-9_\-]+/gi;

/**
 * Redacts known secret tokens, Bearer values, and key patterns from any string.
 */
export function redactString(str: string): string {
  if (!str || typeof str !== 'string') return str;

  let redacted = str;

  // Redact known configured secrets
  for (const secret of KNOWN_SECRETS) {
    if (secret && redacted.includes(secret)) {
      redacted = redacted.split(secret).join('[REDACTED_SECRET_KEY]');
    }
  }

  // Redact Bearer tokens
  redacted = redacted.replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED]');

  // Redact sk_live / sk_test patterns
  redacted = redacted.replace(SK_LIVE_REGEX, '[REDACTED_API_KEY]');

  // Redact pk_live / pk_test patterns
  redacted = redacted.replace(PK_LIVE_REGEX, '[REDACTED_PUBLIC_KEY]');

  return redacted;
}

/**
 * Recursively redacts sensitive keys and values from objects, arrays, or primitives.
 */
export function redactSensitiveData(data: any, depth = 0, visited = new WeakSet()): any {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return redactString(data);
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (typeof data !== 'object') {
    return String(data);
  }

  // Prevent circular references
  if (visited.has(data)) {
    return '[CIRCULAR_REF]';
  }
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, depth + 1, visited));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value, depth + 1, visited);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extracts and redacts HTTP headers safely.
 */
export function redactHeaders(
  headers: HeadersInit | Record<string, any> | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;

  if (typeof (headers as any).forEach === 'function') {
    (headers as any).forEach((value: string, key: string) => {
      const lower = key.toLowerCase();
      if (
        lower === 'authorization' ||
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('cookie')
      ) {
        result[key] = redactString(value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      const lower = key.toLowerCase();
      if (
        lower === 'authorization' ||
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('cookie')
      ) {
        result[key] = redactString(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    const strVal = String(value);
    if (
      lower === 'authorization' ||
      lower.includes('key') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('cookie')
    ) {
      result[key] = redactString(strVal);
    } else {
      result[key] = strVal;
    }
  }

  return result;
}

/**
 * Redacts sensitive query parameters from a URL string.
 */
export function redactUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    for (const [param] of parsed.searchParams.entries()) {
      if (SENSITIVE_KEY_REGEX.test(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    }
    return parsed.toString();
  } catch {
    return redactString(urlStr);
  }
}

// In-memory ring buffer of the latest 100 outgoing Saspay API requests (useful for diagnostics & debugging)
const MAX_LOGS = 100;
const outgoingLogsBuffer: SaspayOutgoingLogEntry[] = [];

/**
 * Returns recent redacted logs of outgoing Saspay requests.
 */
export function getRecentSaspayOutgoingLogs(limit = 50): SaspayOutgoingLogEntry[] {
  return outgoingLogsBuffer.slice(-Math.min(limit, MAX_LOGS));
}

/**
 * Clears the in-memory ring buffer.
 */
export function clearSaspayOutgoingLogs(): void {
  outgoingLogsBuffer.length = 0;
}

export interface SaspayFetchOptions extends RequestInit {
  label?: string;
  transactionReference?: string;
  skipBuffer?: boolean;
}

/**
 * Helper function: performs outgoing HTTP request to Saspay API while logging
 * the full payload, headers, and raw response, with strict redaction of API keys & credentials.
 */
export async function saspayFetch(
  input: string | URL | Request,
  init?: SaspayFetchOptions
): Promise<Response> {
  const startTime = Date.now();
  const logId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
  const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const safeUrl = redactUrl(rawUrl);

  // Extract and redact request headers
  const safeHeaders = redactHeaders(init?.headers);

  // Extract and redact request payload
  let safePayload: any = null;
  let rawRequestBody: string | undefined = undefined;

  if (init?.body) {
    if (typeof init.body === 'string') {
      rawRequestBody = init.body;
      try {
        const parsed = JSON.parse(init.body);
        safePayload = redactSensitiveData(parsed);
      } catch {
        safePayload = redactString(init.body);
      }
    } else {
      safePayload = '[Binary or Stream Body]';
    }
  }

  const timestamp = new Date().toISOString();

  // 1. Log outgoing request
  console.log(`\n=======================================================`);
  console.log(`[SASPAY_OUTGOING_REQUEST] [${logId}]`);
  console.log(`--> Timestamp : ${timestamp}`);
  if (init?.label) console.log(`--> Label     : ${init.label}`);
  if (init?.transactionReference) console.log(`--> Ref       : ${init.transactionReference}`);
  console.log(`--> Method    : ${method}`);
  console.log(`--> URL       : ${safeUrl}`);
  console.log(`--> Headers   :\n${JSON.stringify(safeHeaders, null, 2)}`);
  if (safePayload !== null) {
    console.log(`--> Full Payload:\n${typeof safePayload === 'string' ? safePayload : JSON.stringify(safePayload, null, 2)}`);
  } else {
    console.log(`--> Full Payload: (none)`);
  }
  console.log(`-------------------------------------------------------`);

  const logEntry: SaspayOutgoingLogEntry = {
    id: logId,
    timestamp,
    durationMs: 0,
    label: init?.label,
    transactionReference: init?.transactionReference,
    request: {
      method,
      url: safeUrl,
      headers: safeHeaders,
      payload: safePayload,
    },
  };

  try {
    // Execute actual HTTP request
    const response = await fetch(input, init);
    const durationMs = Date.now() - startTime;
    logEntry.durationMs = durationMs;

    // Clone response so the body stream can be read for raw logging without consuming it for the caller
    const clonedResponse = response.clone();
    let rawResponseBody = '';
    let parsedResponseBody: any = undefined;

    try {
      rawResponseBody = await clonedResponse.text();
      try {
        parsedResponseBody = JSON.parse(rawResponseBody);
        parsedResponseBody = redactSensitiveData(parsedResponseBody);
      } catch {
        // Not JSON
      }
    } catch (e: any) {
      rawResponseBody = `[Error reading raw body: ${e.message}]`;
    }

    const safeResponseHeaders = redactHeaders(response.headers);
    const safeRawResponse = redactString(rawResponseBody);

    logEntry.response = {
      status: response.status,
      statusText: response.statusText,
      headers: safeResponseHeaders,
      rawBody: safeRawResponse,
      parsedBody: parsedResponseBody,
    };

    if (!init?.skipBuffer) {
      outgoingLogsBuffer.push(logEntry);
      if (outgoingLogsBuffer.length > MAX_LOGS) {
        outgoingLogsBuffer.shift();
      }
    }

    // 2. Log raw response
    console.log(`[SASPAY_RAW_RESPONSE] [${logId}]`);
    console.log(`<-- HTTP Status: ${response.status} ${response.statusText} (${durationMs}ms)`);
    console.log(`<-- Headers    :\n${JSON.stringify(safeResponseHeaders, null, 2)}`);
    console.log(`<-- Raw Response Body:\n${safeRawResponse}`);
    console.log(`=======================================================\n`);

    return response;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    logEntry.durationMs = durationMs;
    logEntry.error = error.message || String(error);

    if (!init?.skipBuffer) {
      outgoingLogsBuffer.push(logEntry);
      if (outgoingLogsBuffer.length > MAX_LOGS) {
        outgoingLogsBuffer.shift();
      }
    }

    console.error(`[SASPAY_REQUEST_ERROR] [${logId}]`);
    console.error(`<!- Failed after : ${durationMs}ms`);
    console.error(`<!- Error Message : ${error.message}`);
    console.error(`=======================================================\n`);

    throw error;
  }
}

/**
 * Express middleware helper: logs requests directed towards Saspay/payment gateways
 * with strict redaction of credentials, API keys, tokens, and secrets.
 */
export function saspayOutgoingLoggerMiddleware() {
  return (req: any, res: any, next: any) => {
    const isSaspayRoute = (req.originalUrl || req.url || '').includes('/saspay') ||
      (req.originalUrl || req.url || '').includes('/payments');
    if (isSaspayRoute) {
      const safeHeaders = redactHeaders(req.headers);
      const safeBody = redactSensitiveData(req.body);
      console.log(`[SASPAY_GATEWAY_INTERCEPTOR] ${req.method} ${req.originalUrl || req.url}`);
      console.log(`--> Safe Headers:\n${JSON.stringify(safeHeaders, null, 2)}`);
      if (safeBody && Object.keys(safeBody).length > 0) {
        console.log(`--> Safe Body:\n${JSON.stringify(safeBody, null, 2)}`);
      }
    }
    next();
  };
}

export { logSaspayRequest, saspayLoggerMiddleware } from '../src/server/middleware/saspayLogger';
