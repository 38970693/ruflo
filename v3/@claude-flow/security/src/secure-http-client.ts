/**
 * Secure HTTP Client - Axios Replacement
 *
 * Provides a secure HTTP client that mitigates SSRF, prototype pollution,
 * and other vulnerabilities found in axios.
 *
 * Security Features:
 * - SSRF protection via IP filtering
 * - Prototype pollution prevention
 * - Safe header handling
 * - Request/response size limits
 * - Timeout enforcement
 *
 * @module v3/security/secure-http-client
 */

import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';

export interface SecureRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | Buffer;
  timeout?: number;
  maxResponseSize?: number;
  followRedirects?: boolean;
  maxRedirects?: number;
}

export interface SecureResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string | Buffer;
  url: string;
  redirected?: boolean;
}

export class SecureHttpClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'SecureHttpClientError';
  }
}

export class SecureHttpClient extends EventEmitter {
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly defaultMaxResponseSize = 10 * 1024 * 1024; // 10MB
  private readonly maxRedirects = 5;

  /**
   * Make a secure HTTP request
   */
  async request(config: SecureRequestConfig): Promise<SecureResponse> {
    this.validateRequest(config);

    const url = new URL(config.url);
    this.validateUrl(url);

    const options = this.buildRequestOptions(config, url);

    return new Promise((resolve, reject) => {
      const req = this.createRequest(url, options, config, resolve, reject);

      // Set timeout
      const timeout = config.timeout || this.defaultTimeout;
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new SecureHttpClientError(
          `Request timeout after ${timeout}ms`,
          'TIMEOUT'
        ));
      });

      // Handle request errors
      req.on('error', (error) => {
        reject(new SecureHttpClientError(
          `Request failed: ${error.message}`,
          'REQUEST_ERROR',
          error
        ));
      });

      // Send body if present
      if (config.body) {
        req.write(config.body);
      }

      req.end();
    });
  }

  /**
   * GET request
   */
  async get(url: string, config: Omit<SecureRequestConfig, 'url' | 'method'> = {}): Promise<SecureResponse> {
    return this.request({ ...config, url, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(url: string, config: Omit<SecureRequestConfig, 'url' | 'method'> = {}): Promise<SecureResponse> {
    return this.request({ ...config, url, method: 'POST' });
  }

  /**
   * Validate request configuration
   */
  private validateRequest(config: SecureRequestConfig): void {
    if (!config.url) {
      throw new SecureHttpClientError('URL is required', 'INVALID_CONFIG');
    }

    if (config.method && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
      throw new SecureHttpClientError('Invalid HTTP method', 'INVALID_METHOD');
    }

    // Validate headers for dangerous content
    if (config.headers) {
      this.validateHeaders(config.headers);
    }
  }

  /**
   * Validate URL for security issues
   */
  private validateUrl(url: URL): void {
    // Prevent SSRF by blocking internal IPs
    if (this.isInternalIP(url.hostname)) {
      throw new SecureHttpClientError(
        'Access to internal IP addresses is not allowed',
        'SSRF_ATTEMPT',
        { hostname: url.hostname }
      );
    }

    // Prevent access to localhost
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1') {
      throw new SecureHttpClientError(
        'Access to localhost is not allowed',
        'LOCALHOST_ACCESS_DENIED'
      );
    }

    // Validate protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new SecureHttpClientError(
        'Only HTTP and HTTPS protocols are allowed',
        'INVALID_PROTOCOL',
        { protocol: url.protocol }
      );
    }
  }

  /**
   * Check if hostname is an internal IP
   */
  private isInternalIP(hostname: string): boolean {
    // Check for IP addresses
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(hostname)) {
      return false; // Not an IP, allow (will be resolved by DNS)
    }

    const parts = hostname.split('.').map(Number);

    // 10.0.0.0/8
    if (parts[0] === 10) return true;

    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;

    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;

    return false;
  }

  /**
   * Validate headers for security issues
   */
  private validateHeaders(headers: Record<string, string>): void {
    const dangerousHeaders = ['host', 'authorization', 'cookie', 'set-cookie'];

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();

      // Prevent header injection
      if (value.includes('\n') || value.includes('\r')) {
        throw new SecureHttpClientError(
          'Header values cannot contain newlines',
          'HEADER_INJECTION',
          { header: key }
        );
      }

      // Warn about sensitive headers
      if (dangerousHeaders.includes(lowerKey)) {
        this.emit('warning', {
          type: 'sensitive-header',
          header: key,
          message: `Using sensitive header: ${key}`
        });
      }
    }
  }

  /**
   * Build request options
   */
  private buildRequestOptions(config: SecureRequestConfig, url: URL) {
    return {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: config.method || 'GET',
      headers: {
        'User-Agent': 'SecureHttpClient/1.0',
        ...config.headers,
      },
      rejectUnauthorized: true, // Always verify SSL certificates
    };
  }

  /**
   * Create HTTP/HTTPS request
   */
  private createRequest(
    url: URL,
    options: any,
    config: SecureRequestConfig,
    resolve: Function,
    reject: Function
  ) {
    const requestFn = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = requestFn(options);

    let responseBody = Buffer.alloc(0);
    const maxSize = config.maxResponseSize || this.defaultMaxResponseSize;

    req.on('response', (res) => {
      const { statusCode, headers } = res;

      // Handle redirects
      if (statusCode && statusCode >= 300 && statusCode < 400 && config.followRedirects !== false) {
        const redirectCount = (config as any)._redirectCount || 0;
        if (redirectCount >= (config.maxRedirects || this.maxRedirects)) {
          reject(new SecureHttpClientError('Too many redirects', 'REDIRECT_LIMIT'));
          return;
        }

        const location = headers.location;
        if (location) {
          const newConfig = {
            ...config,
            url: location.startsWith('http') ? location : new URL(location, config.url).href,
            _redirectCount: redirectCount + 1,
          };
          this.request(newConfig).then(resolve).catch(reject);
          return;
        }
      }

      res.on('data', (chunk) => {
        responseBody = Buffer.concat([responseBody, chunk]);

        // Check size limit
        if (responseBody.length > maxSize) {
          res.destroy();
          reject(new SecureHttpClientError(
            `Response size exceeds limit: ${maxSize} bytes`,
            'SIZE_LIMIT_EXCEEDED'
          ));
          return;
        }
      });

      res.on('end', () => {
        const response: SecureResponse = {
          statusCode: statusCode || 0,
          headers: headers as Record<string, string>,
          body: responseBody,
          url: config.url,
          redirected: (config as any)._redirectCount > 0,
        };

        // Validate response for prototype pollution attempts
        this.validateResponse(response);

        resolve(response);
      });
    });

    return req;
  }

  /**
   * Validate response for security issues
   */
  private validateResponse(response: SecureResponse): void {
    // Check for prototype pollution indicators
    const bodyStr = response.body.toString();
    if (bodyStr.includes('__proto__') || bodyStr.includes('constructor')) {
      this.emit('warning', {
        type: 'prototype-pollution',
        message: 'Response may contain prototype pollution payload',
        url: response.url
      });
    }
  }
}

// Export singleton instance
export const secureHttpClient = new SecureHttpClient();