/**
 * Cloudflare Worker - Full Iframe Proxy
 * Proxies all resources to bypass CORS and X-Frame-Options
 *
 * Deploy: wrangler deploy
 * Usage: https://your-worker.workers.dev/?url=https://example.com
 */

const PROXY_URL = 'https://tv-proxy.shariflii.workers.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    // Validate URL parameter
    if (!targetUrl) {
      return new Response('Missing url parameter', { status: 400, headers: corsHeaders() });
    }

    try {
      const targetUrlObj = new URL(targetUrl);
      const baseUrl = `${targetUrlObj.protocol}//${targetUrlObj.host}`;

      // Fetch the target URL
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': request.headers.get('Accept') || '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });

      const contentType = response.headers.get('content-type') || '';
      const newHeaders = cleanHeaders(response.headers);

      // Process HTML - rewrite URLs to go through proxy
      if (contentType.includes('text/html')) {
        let html = await response.text();
        html = rewriteHtml(html, baseUrl);
        return new Response(html, { status: response.status, headers: newHeaders });
      }

      // Process CSS - rewrite url() references
      if (contentType.includes('text/css')) {
        let css = await response.text();
        css = rewriteCss(css, baseUrl);
        return new Response(css, { status: response.status, headers: newHeaders });
      }

      // Pass through other resources (images, fonts, js)
      return new Response(response.body, { status: response.status, headers: newHeaders });

    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, { status: 500, headers: corsHeaders() });
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
}

function cleanHeaders(headers) {
  const newHeaders = new Headers();
  for (const [key, value] of headers) {
    const k = key.toLowerCase();
    if (k === 'x-frame-options') continue;
    if (k === 'content-security-policy') continue;
    if (k === 'content-security-policy-report-only') continue;
    newHeaders.set(key, value);
  }
  newHeaders.set('Access-Control-Allow-Origin', '*');
  return newHeaders;
}

function proxyUrl(originalUrl, baseUrl) {
  // Handle relative URLs
  let absolute;
  if (originalUrl.startsWith('//')) {
    absolute = 'https:' + originalUrl;
  } else if (originalUrl.startsWith('/')) {
    absolute = baseUrl + originalUrl;
  } else if (originalUrl.startsWith('http')) {
    absolute = originalUrl;
  } else {
    absolute = baseUrl + '/' + originalUrl;
  }
  return `${PROXY_URL}/?url=${encodeURIComponent(absolute)}`;
}

function rewriteHtml(html, baseUrl) {
  // Inject script to suppress errors
  const fixScript = `<script>(function(){try{history.pushState=history.replaceState=function(){};}catch(e){}})();</script>`;

  // Rewrite src and href attributes
  html = html.replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, url) => {
    if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) {
      return match;
    }
    return `${attr}="${proxyUrl(url, baseUrl)}"`;
  });

  // Rewrite srcset
  html = html.replace(/srcset=["']([^"']+)["']/gi, (match, srcset) => {
    const rewritten = srcset.split(',').map(part => {
      const [url, size] = part.trim().split(/\s+/);
      return `${proxyUrl(url, baseUrl)} ${size || ''}`.trim();
    }).join(', ');
    return `srcset="${rewritten}"`;
  });

  // Inject fix script
  if (html.includes('<head>')) {
    html = html.replace('<head>', `<head>${fixScript}`);
  } else if (html.includes('<HEAD>')) {
    html = html.replace('<HEAD>', `<HEAD>${fixScript}`);
  }

  return html;
}

function rewriteCss(css, baseUrl) {
  // Rewrite url() in CSS
  return css.replace(/url\(["']?([^)"']+)["']?\)/gi, (match, url) => {
    if (url.startsWith('data:')) return match;
    return `url("${proxyUrl(url, baseUrl)}")`;
  });
}
