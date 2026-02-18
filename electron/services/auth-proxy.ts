/**
 * Local Auth Proxy for TD LLM Proxy
 *
 * The Claude Agent SDK subprocess sends requests with `x-api-key` header
 * (standard Anthropic format), but the TD LLM proxy expects
 * `Authorization: TD1 {key}`. This local proxy bridges the gap:
 *
 *   Claude Code subprocess → http://localhost:{port}/v1/messages
 *     → translates auth header → https://llm-proxy.us01.treasuredata.com/v1/messages
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

let server: http.Server | null = null;
let localPort: number | null = null;
let targetUrl: string = '';

/**
 * Start the local auth proxy. Returns the localhost URL to use as ANTHROPIC_BASE_URL.
 */
export function startAuthProxy(tdProxyUrl: string): Promise<string> {
  targetUrl = tdProxyUrl.replace(/\/$/, '');

  return new Promise((resolve, reject) => {
    if (server) {
      // Already running
      resolve(`http://127.0.0.1:${localPort}`);
      return;
    }

    server = http.createServer((req, res) => {
      // Read the full request body
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        const body = Buffer.concat(chunks);

        // Extract the API key from x-api-key header (sent by Anthropic SDK)
        const apiKey = req.headers['x-api-key'] as string | undefined;

        // Build target URL
        const targetFullUrl = new URL(req.url || '/', targetUrl);

        // Forward headers, replacing auth
        const forwardHeaders: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (!value) continue;
          const lowerKey = key.toLowerCase();
          // Skip hop-by-hop and auth headers we'll replace
          if (lowerKey === 'host' || lowerKey === 'x-api-key' || lowerKey === 'connection') continue;
          forwardHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
        }

        // Set TD auth header
        if (apiKey) {
          forwardHeaders['Authorization'] = `TD1 ${apiKey}`;
        }

        // Set content length
        if (body.length > 0) {
          forwardHeaders['content-length'] = body.length.toString();
        }

        const options: https.RequestOptions = {
          hostname: targetFullUrl.hostname,
          port: targetFullUrl.port || 443,
          path: targetFullUrl.pathname + targetFullUrl.search,
          method: req.method || 'POST',
          headers: forwardHeaders,
        };

        const proxyReq = https.request(options, (proxyRes) => {
          // Forward status and headers
          res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
          // Stream response back
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          console.error('[AuthProxy] Proxy request error:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: `Auth proxy error: ${err.message}` } }));
        });

        if (body.length > 0) {
          proxyReq.write(body);
        }
        proxyReq.end();
      });
    });

    // Listen on a random available port
    server.listen(0, '127.0.0.1', () => {
      const addr = server!.address();
      if (addr && typeof addr === 'object') {
        localPort = addr.port;
        console.log(`[AuthProxy] Started on http://127.0.0.1:${localPort} → ${targetUrl}`);
        resolve(`http://127.0.0.1:${localPort}`);
      } else {
        reject(new Error('Failed to get proxy server address'));
      }
    });

    server.on('error', (err) => {
      console.error('[AuthProxy] Server error:', err.message);
      reject(err);
    });
  });
}

/**
 * Update the target URL without restarting the proxy.
 */
export function updateProxyTarget(newTargetUrl: string): void {
  targetUrl = newTargetUrl.replace(/\/$/, '');
  console.log(`[AuthProxy] Target updated to ${targetUrl}`);
}

/**
 * Stop the auth proxy.
 */
export function stopAuthProxy(): void {
  if (server) {
    server.close();
    server = null;
    localPort = null;
    console.log('[AuthProxy] Stopped');
  }
}

/**
 * Check if the proxy is running.
 */
export function isAuthProxyRunning(): boolean {
  return server !== null;
}

/**
 * Get the local proxy URL, or null if not running.
 */
export function getAuthProxyUrl(): string | null {
  if (localPort) return `http://127.0.0.1:${localPort}`;
  return null;
}
