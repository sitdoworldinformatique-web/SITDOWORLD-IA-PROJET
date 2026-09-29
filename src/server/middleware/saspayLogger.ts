/**
 * SITDOWORLD AI MUSIC - SASPAY API Logger & Interceptor Middleware
 *
 * Defines and exports the 'logSaspayRequest' helper function and Express middleware.
 * Captures request details (URL, headers, body) and response details (status, body)
 * while using a masking utility to redact sensitive fields such as 'Authorization',
 * 'pin', 'secret', 'apiKey', and 'password'.
 */

import type { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';

// Sensitive field names to redact in payloads and headers (case-insensitive)
const SENSITIVE_FIELDS_REGEX = /^(authorization|pin|secret|secret_key|secretkey|apikey|api_key|password|cvv|token|access_token|refresh_token|private_key|webhook_secret|bearer|auth)$/i;

// Regex patterns to detect and mask API keys / tokens within string values
const BEARER_REGEX = /Bearer\s+([A-Za-z0-9_\-\.]+)/gi;
const SECRET_KEY_REGEX = /sk_(live|test)_[a-zA-Z0-9_\-]+/gi;
const PUBLIC_KEY_REGEX = /pk_(live|test)_[a-zA-Z0-9_\-]+/gi;

/**
 * Mask sensitive string patterns (Bearer tokens, secret keys, etc.)
 */
export function maskSensitiveString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(BEARER_REGEX, 'Bearer [REDACTED]')
    .replace(SECRET_KEY_REGEX, '[REDACTED_SECRET_KEY]')
    .replace(PUBLIC_KEY_REGEX, '[REDACTED_PUBLIC_KEY]');
}

/**
 * Masking utility: recursively redacts sensitive fields such as
 * 'Authorization', 'pin', 'secret', 'apiKey', and 'password' from any object or array.
 */
export function maskSensitiveData<T = any>(data: T, depth = 0, visited = new WeakSet()): T {
  if (depth > 10) return '[MAX_DEPTH_EXCEEDED]' as any;
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return maskSensitiveString(data) as any;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (typeof data !== 'object') {
    return String(data) as any;
  }

  if (visited.has(data)) {
    return '[CIRCULAR_REF]' as any;
  }
  visited.add(data);

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item, depth + 1, visited)) as any;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      sanitized[key] = maskSensitiveString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = maskSensitiveData(value, depth + 1, visited);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as any;
}

// Backward-compatibility alias
export const redactPayload = maskSensitiveData;

/**
 * Extracts and redacts headers, ensuring 'Authorization', 'apiKey', 'secret', etc. are masked.
 */
export function maskSensitiveHeaders(headers: any): Record<string, string> {
  const sanitized: Record<string, string> = {};
  if (!headers) return sanitized;

  // Handle Headers object (e.g. from fetch)
  if (typeof headers.forEach === 'function') {
    headers.forEach((val: string, key: string) => {
      const lower = key.toLowerCase();
      if (
        SENSITIVE_FIELDS_REGEX.test(lower) ||
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('cookie')
      ) {
        sanitized[key] = maskSensitiveString(val).includes('[REDACTED')
          ? maskSensitiveString(val)
          : '[REDACTED]';
      } else {
        sanitized[key] = val;
      }
    });
    return sanitized;
  }

  // Handle Array of entries [ [key, val], ... ]
  if (Array.isArray(headers)) {
    for (const [key, val] of headers) {
      const lower = String(key).toLowerCase();
      if (
        SENSITIVE_FIELDS_REGEX.test(lower) ||
        lower.includes('key') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('cookie')
      ) {
        sanitized[key] = maskSensitiveString(String(val)).includes('[REDACTED')
          ? maskSensitiveString(String(val))
          : '[REDACTED]';
      } else {
        sanitized[key] = String(val);
      }
    }
    return sanitized;
  }

  // Handle plain Record<string, any>
  for (const [key, val] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    const strVal = String(val);
    if (
      SENSITIVE_FIELDS_REGEX.test(lower) ||
      lower.includes('key') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('cookie')
    ) {
      sanitized[key] = maskSensitiveString(strVal).includes('[REDACTED')
        ? maskSensitiveString(strVal)
        : '[REDACTED]';
    } else {
      sanitized[key] = strVal;
    }
  }

  return sanitized;
}

// Backward-compatibility alias
export const redactHeaders = maskSensitiveHeaders;

/**
 * Sanitizes URL to prevent sensitive query parameters from being logged.
 */
export function redactUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr, 'http://localhost');
    for (const [param] of parsed.searchParams.entries()) {
      if (SENSITIVE_FIELDS_REGEX.test(param) || param.toLowerCase().includes('key')) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    }
    return urlStr.startsWith('http://') || urlStr.startsWith('https://')
      ? parsed.toString()
      : parsed.pathname + parsed.search;
  } catch {
    return maskSensitiveString(urlStr);
  }
}

export interface SaspayRequestDetails {
  url: string | URL;
  method?: string;
  headers?: any;
  body?: any;
  label?: string;
  transactionReference?: string;
}

export interface SaspayResponseDetails {
  status?: number | string;
  statusText?: string;
  headers?: any;
  body?: any;
  rawBody?: string;
}

export interface SaspayLogRecord {
  timestamp: string;
  durationMs: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  payload: any;
  response: {
    status?: number | string;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
    rawBody?: string;
  };
  error?: string;
}

// In-memory circular buffer of logged Saspay requests (max 100)
const saspayLogsHistory: SaspayLogRecord[] = [];
export function getSaspayLogsHistory(limit = 50): SaspayLogRecord[] {
  return saspayLogsHistory.slice(-Math.min(limit, 100));
}
export function clearSaspayLogsHistory(): void {
  saspayLogsHistory.length = 0;
}

/**
 * Formats and outputs the masked request & response details to the console.
 */
function outputLogToConsole(
  reqLog: {
    method: string;
    url: string;
    headers: Record<string, string>;
    payload: any;
    timestamp: string;
    label?: string;
    transactionReference?: string;
  },
  resLog?: {
    status?: number | string;
    statusText?: string;
    headers?: Record<string, string>;
    body?: any;
    rawBody?: string;
    durationMs?: number;
  }
) {
  console.log(`\n=======================================================`);
  console.log(`[SASPAY_API_REQUEST] ${reqLog.method} ${reqLog.url}`);
  console.log(`--> Timestamp : ${reqLog.timestamp}`);
  if (reqLog.label) console.log(`--> Context   : ${reqLog.label}`);
  if (reqLog.transactionReference) console.log(`--> Ref       : ${reqLog.transactionReference}`);
  console.log(`--> Headers   :\n${JSON.stringify(reqLog.headers, null, 2)}`);
  if (reqLog.payload !== null && reqLog.payload !== undefined) {
    console.log(`--> Full Payload:\n${typeof reqLog.payload === 'string' ? reqLog.payload : JSON.stringify(reqLog.payload, null, 2)}`);
  } else {
    console.log(`--> Full Payload: (none)`);
  }
  console.log(`-------------------------------------------------------`);

  if (resLog) {
    const durationStr = resLog.durationMs !== undefined ? ` (${resLog.durationMs}ms)` : '';
    console.log(`[SASPAY_API_RESPONSE] ${resLog.status ?? 'N/A'} ${resLog.statusText ?? ''}${durationStr}`);
    if (resLog.headers && Object.keys(resLog.headers).length > 0) {
      console.log(`<-- Headers :\n${JSON.stringify(resLog.headers, null, 2)}`);
    }
    if (resLog.body !== undefined || resLog.rawBody !== undefined) {
      const displayBody = resLog.body !== undefined
        ? (typeof resLog.body === 'string' ? resLog.body : JSON.stringify(resLog.body, null, 2))
        : resLog.rawBody;
      console.log(`<-- Full Response Body:\n${displayBody}`);
    }
    console.log(`=======================================================\n`);
  }
}

/**
 * Overloaded helper function 'logSaspayRequest':
 *
 * Signature A (Explicit Request & Response details):
 *   `logSaspayRequest(requestDetails, responseDetails)`
 *   - Captures request details (URL, headers, body) and response details (status, body)
 *   - Logs them to the console with sensitive fields ('Authorization', 'pin', 'secret', 'apiKey', 'password') redacted.
 *
 * Signature B (Fetch drop-in replacement):
 *   `const response = await logSaspayRequest(url, options);`
 *   - Executes the fetch request, logs both request and response with redaction, and returns the response.
 */
export function logSaspayRequest(
  request: SaspayRequestDetails,
  response?: SaspayResponseDetails
): void;
export function logSaspayRequest(
  urlOrInput: string | URL | Request,
  options?: RequestInit & { label?: string; transactionReference?: string },
  existingResponse?: Response | SaspayResponseDetails
): Promise<Response>;
export async function logSaspayRequest(
  arg1: string | URL | Request | SaspayRequestDetails,
  arg2?: (RequestInit & { label?: string; transactionReference?: string }) | SaspayResponseDetails,
  arg3?: Response | SaspayResponseDetails
): Promise<any> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Detection: Check if arg1 is SaspayRequestDetails object { url, headers, body, ... }
  const isDetailsObject =
    typeof arg1 === 'object' &&
    arg1 !== null &&
    'url' in arg1 &&
    !('clone' in arg1) &&
    !('text' in arg1) &&
    !('signal' in arg1);

  if (isDetailsObject) {
    // Mode A: Direct Request & Response details logging
    const reqDetails = arg1 as SaspayRequestDetails;
    const resDetails = arg2 as SaspayResponseDetails | undefined;

    const rawUrl = typeof reqDetails.url === 'string'
      ? reqDetails.url
      : reqDetails.url.toString();
    const cleanUrl = redactUrl(rawUrl);
    const method = (reqDetails.method || 'POST').toUpperCase();
    const safeHeaders = maskSensitiveHeaders(reqDetails.headers);

    let safePayload: any = null;
    if (reqDetails.body !== undefined && reqDetails.body !== null) {
      if (typeof reqDetails.body === 'string') {
        try {
          safePayload = maskSensitiveData(JSON.parse(reqDetails.body));
        } catch {
          safePayload = maskSensitiveString(reqDetails.body);
        }
      } else {
        safePayload = maskSensitiveData(reqDetails.body);
      }
    }

    let safeResBody: any = undefined;
    let safeResRaw: string | undefined = undefined;
    if (resDetails?.body !== undefined) {
      if (typeof resDetails.body === 'string') {
        try {
          safeResBody = maskSensitiveData(JSON.parse(resDetails.body));
        } catch {
          safeResBody = maskSensitiveString(resDetails.body);
        }
      } else {
        safeResBody = maskSensitiveData(resDetails.body);
      }
    }
    if (resDetails?.rawBody) {
      safeResRaw = maskSensitiveString(resDetails.rawBody);
    }

    const safeResponseHeaders = maskSensitiveHeaders(resDetails?.headers);

    outputLogToConsole(
      {
        method,
        url: cleanUrl,
        headers: safeHeaders,
        payload: safePayload,
        timestamp,
        label: reqDetails.label,
        transactionReference: reqDetails.transactionReference,
      },
      resDetails
        ? {
            status: resDetails.status,
            statusText: resDetails.statusText,
            headers: safeResponseHeaders,
            body: safeResBody,
            rawBody: safeResRaw,
          }
        : undefined
    );

    const logRecord: SaspayLogRecord = {
      timestamp,
      durationMs: 0,
      url: cleanUrl,
      method,
      headers: safeHeaders,
      payload: safePayload,
      response: {
        status: resDetails?.status,
        statusText: resDetails?.statusText,
        headers: safeResponseHeaders,
        body: safeResBody,
        rawBody: safeResRaw,
      },
    };
    saspayLogsHistory.push(logRecord);
    if (saspayLogsHistory.length > 100) saspayLogsHistory.shift();

    return;
  }

  // Mode B: Fetch URL/Input execution or Fetch wrapper
  const urlOrInput = arg1 as string | URL | Request;
  const options = arg2 as (RequestInit & { label?: string; transactionReference?: string }) | undefined;
  const existingResponse = arg3;

  const rawUrl = typeof urlOrInput === 'string'
    ? urlOrInput
    : urlOrInput instanceof URL
    ? urlOrInput.toString()
    : (urlOrInput as any).url || String(urlOrInput);

  const cleanUrl = redactUrl(rawUrl);
  const method = (options?.method || (typeof urlOrInput === 'object' && 'method' in urlOrInput ? (urlOrInput as any).method : 'GET')).toUpperCase();
  const safeHeaders = maskSensitiveHeaders(options?.headers || (typeof urlOrInput === 'object' && 'headers' in urlOrInput ? (urlOrInput as any).headers : undefined));

  let safePayload: any = null;
  if (options?.body) {
    if (typeof options.body === 'string') {
      try {
        const parsed = JSON.parse(options.body);
        safePayload = maskSensitiveData(parsed);
      } catch {
        safePayload = maskSensitiveString(options.body);
      }
    } else {
      safePayload = '[Binary/FormData Body]';
    }
  }

  try {
    let response: Response;

    if (existingResponse instanceof Response) {
      response = existingResponse;
    } else {
      // Execute the actual HTTP request
      response = await fetch(urlOrInput as any, options);
    }

    const durationMs = Date.now() - startTime;
    let safeRawResponse = '';
    let parsedResponseBody: any = undefined;

    try {
      const cloned = response.clone();
      const rawText = await cloned.text();
      try {
        parsedResponseBody = maskSensitiveData(JSON.parse(rawText));
      } catch {
        // Raw text response
      }
      safeRawResponse = maskSensitiveString(rawText);
    } catch (e: any) {
      safeRawResponse = `[Response body not inspectable: ${e.message}]`;
    }

    const safeResponseHeaders = maskSensitiveHeaders(response.headers);

    outputLogToConsole(
      {
        method,
        url: cleanUrl,
        headers: safeHeaders,
        payload: safePayload,
        timestamp,
        label: options?.label,
        transactionReference: options?.transactionReference,
      },
      {
        status: response.status,
        statusText: response.statusText,
        headers: safeResponseHeaders,
        body: parsedResponseBody,
        rawBody: safeRawResponse,
        durationMs,
      }
    );

    const logRecord: SaspayLogRecord = {
      timestamp,
      durationMs,
      url: cleanUrl,
      method,
      headers: safeHeaders,
      payload: safePayload,
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: safeResponseHeaders,
        body: parsedResponseBody,
        rawBody: safeRawResponse,
      },
    };

    saspayLogsHistory.push(logRecord);
    if (saspayLogsHistory.length > 100) {
      saspayLogsHistory.shift();
    }

    return response;
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error(`[SASPAY_API_ERROR] Request to ${cleanUrl} failed after ${durationMs}ms: ${err.message}`);
    console.error(`=======================================================\n`);

    saspayLogsHistory.push({
      timestamp,
      durationMs,
      url: cleanUrl,
      method,
      headers: safeHeaders,
      payload: safePayload,
      response: {},
      error: err.message || String(err),
    });

    throw err;
  }
}

/**
 * Backend Express middleware that intercepts and logs all incoming and routed
 * requests to the Saspay API, logging URL, redacted headers, full payload,
 * and intercepting the outgoing response.
 */
export function saspayLoggerMiddleware(req: ExpressRequest, res: ExpressResponse, next: NextFunction): void {
  const url = req.originalUrl || req.url || '';
  const isSaspay =
    url.includes('/saspay') ||
    url.includes('/payments') ||
    url.includes('/checkout') ||
    url.includes('/softpay');

  if (!isSaspay) {
    return next();
  }

  const startTime = Date.now();
  const safeHeaders = maskSensitiveHeaders(req.headers);
  const safeBody = maskSensitiveData(req.body);
  const cleanUrl = redactUrl(url);

  console.log(`\n=======================================================`);
  console.log(`[SASPAY_MIDDLEWARE_INTERCEPT] --> Incoming ${req.method} ${cleanUrl}`);
  console.log(`--> Headers:\n${JSON.stringify(safeHeaders, null, 2)}`);
  if (safeBody && Object.keys(safeBody).length > 0) {
    console.log(`--> Full Payload:\n${JSON.stringify(safeBody, null, 2)}`);
  }
  console.log(`-------------------------------------------------------`);

  // Intercept the response to log response status, headers, and payload
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  let responseBodyLogged = false;

  const logResponse = (bodyData: any) => {
    if (responseBodyLogged) return;
    responseBodyLogged = true;

    const durationMs = Date.now() - startTime;
    const safeResponseHeaders = maskSensitiveHeaders(res.getHeaders ? res.getHeaders() : {});
    let sanitizedBody: any;

    if (typeof bodyData === 'string') {
      try {
        sanitizedBody = maskSensitiveData(JSON.parse(bodyData));
      } catch {
        sanitizedBody = maskSensitiveString(bodyData);
      }
    } else {
      sanitizedBody = maskSensitiveData(bodyData);
    }

    console.log(`[SASPAY_MIDDLEWARE_INTERCEPT] <-- Outgoing ${res.statusCode} (${durationMs}ms)`);
    console.log(`<-- Headers:\n${JSON.stringify(safeResponseHeaders, null, 2)}`);
    console.log(`<-- Full Response Body:\n${typeof sanitizedBody === 'string' ? sanitizedBody : JSON.stringify(sanitizedBody, null, 2)}`);
    console.log(`=======================================================\n`);
  };

  res.send = function (body: any): ExpressResponse {
    logResponse(body);
    return originalSend(body);
  };

  res.json = function (body: any): ExpressResponse {
    logResponse(body);
    return originalJson(body);
  };

  next();
}

export default saspayLoggerMiddleware;
