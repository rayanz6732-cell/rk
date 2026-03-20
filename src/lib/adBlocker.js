// Ad blocker utility - comprehensive ad and malware blocking
const BLOCKED_DOMAINS = [
  // Major ad networks
  'googleadservices.com',
  'doubleclick.net',
  'googlesyndication.com',
  'facebook.com/tr',
  'connect.facebook.net',
  'analytics.google.com',
  'google-analytics.com',
  'pagead2.googlesyndication.com',
  'adservice.google.com',
  'ads.google.com',
  'afs.googleadservices.com',
  // Malware & tracking
  'exoclick.com',
  'adlinkfly.net',
  'clicksor.com',
  'traffichaus.com',
  'popads.net',
  'propeller.media',
  'pubexchange.com',
  'media.net',
  'mgid.com',
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'quantcast.com',
  'chartbeat.net',
  'moat.com',
  'adnxs.com',
  'rubiconproject.com',
  'openx.net',
  'pubmatic.com',
  'appnexus.com',
  'adroll.com',
  'adsrvr.org',
  'vidyard.com',
  'ads-adnxs.com',
  // User blocked sites
  'primevideo.com',
  'aliexpress.com',
  'opera.com',
  'flirtingtok.com',
  'ouraidream.com',
];

// Block ads and malware at network level
export function initAdBlocker() {
  // Set Content Security Policy
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = `
    default-src 'self' https:;
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:;
    style-src 'self' 'unsafe-inline' https:;
    img-src 'self' data: https: blob:;
    media-src 'self' blob: https:;
    iframe-src 'self' https: blob:;
    connect-src 'self' https: wss: blob:;
    frame-ancestors 'self';
  `.replace(/\n/g, '');
  document.head.appendChild(meta);

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0]?.toString?.() || '';
    
    if (isBlockedUrl(url)) {
      console.warn('[AdBlocker] Blocked fetch:', url);
      return Promise.reject(new Error('Blocked by ad blocker'));
    }
    
    return originalFetch.apply(this, args);
  };

  // Block XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (isBlockedUrl(url)) {
      console.warn('[AdBlocker] Blocked XHR:', url);
      this._blocked = true;
      return;
    }
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._blocked) return;
    return originalSend.apply(this, args);
  };

  // Block script tags from ad domains
  const originalCreateElement = document.createElement;
  document.createElement = function(tag) {
    const element = originalCreateElement.call(document, tag);
    
    if (tag === 'script') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(attr, value) {
        if (attr === 'src' && value && !isBlockedUrl(value) === false) {
          console.warn('[AdBlocker] Blocked script:', value);
          return;
        }
        return originalSetAttribute.call(this, attr, value);
      };
    }
    
    if (tag === 'img') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(attr, value) {
        if ((attr === 'src' || attr === 'data-src') && isBlockedUrl(value)) {
          console.warn('[AdBlocker] Blocked image:', value);
          element.style.display = 'none';
          return;
        }
        return originalSetAttribute.call(this, attr, value);
      };
    }
    
    return element;
  };

  // Block popups aggressively
  const originalWindowOpen = window.open;
  window.open = function(url, ...rest) {
    if (url && (isBlockedUrl(url) || url.includes('ad') || url.includes('pop'))) {
      console.warn('[AdBlocker] Blocked popup:', url);
      return null;
    }
    return originalWindowOpen.apply(window, [url, ...rest]);
  };

  // Prevent ads from dynamically injecting content
  const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', {
    set(value) {
      if (containsAdCode(value)) {
        console.warn('[AdBlocker] Blocked ad injection');
        return;
      }
      return originalInnerHTML.set.call(this, value);
    },
    get() {
      return originalInnerHTML.get.call(this);
    },
  });

  // DOM mutation observer - only watches direct children of <body>, never touches React's subtree
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        // Skip anything inside React's root to avoid conflicts
        if (node.closest?.('#root')) continue;
        if (isAdElement(node)) {
          setTimeout(() => {
            try {
              if (node.parentNode) node.parentNode.removeChild(node);
            } catch (_) {}
          }, 0);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: false, // Only direct children of <body>, never React's tree
  });

  console.log('[AdBlocker] Initialized - Full protection enabled');
}

const ALLOWED_DOMAINS = [
  'highperformanceformat.com',
];

// Check if URL belongs to blocked domain
function isBlockedUrl(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url, window.location.origin);
    const hostname = urlObj.hostname;

    if (ALLOWED_DOMAINS.some(d => hostname.includes(d))) return false;
    
    return BLOCKED_DOMAINS.some(domain => 
      hostname.includes(domain) || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

// Detect ad code patterns
function containsAdCode(html) {
  const adPatterns = [
    /google.*ad/i,
    /doubleclick/i,
    /adsbygoogle/i,
    /exoclick/i,
    /popunder/i,
    /showad/i,
    /ad\.gif/i,
    /banner.*ad/i,
    /advert/i,
    /ads-adnxs/i,
    /criteo/i,
    /taboola/i,
    /outbrain/i,
  ];
  
  return adPatterns.some(pattern => pattern.test(html));
}

// Detect ad elements in DOM
function isAdElement(element) {
  if (!element) return false;
  
  const classList = element.className?.toLowerCase?.() || '';
  const id = element.id?.toLowerCase?.() || '';
  const dataAttrs = element.dataset || {};
  
  // Use word-boundary matching to avoid false positives like "absolute", "shadow", "gradient"
  const adClassPatterns = [/\bad\b/, /\bads\b/, /\badvert\b/, /\bbanner\b/, /\bpopup\b/, /\bpopunder\b/];

  for (const pattern of adClassPatterns) {
    if (pattern.test(classList) || pattern.test(id)) {
      return true;
    }
  }
  
  // Check for suspicious attributes
  if (element.src && isBlockedUrl(element.src)) return true;
  if (element.href && isBlockedUrl(element.href)) return true;
  if (element.onclick?.toString?.().includes('ad')) return true;
  
  return false;
}

// Block ads on iframes
export function blockIframeAds(iframeElement) {
  if (!iframeElement) return;
  
  // Sandbox the iframe with minimal permissions
  iframeElement.setAttribute('sandbox', 
    'allow-same-origin allow-scripts allow-presentation allow-fullscreen'
  );
  
  // Block window.open in iframe
  try {
    iframeElement.onload = () => {
      try {
        iframeElement.contentWindow.open = function() {
          console.warn('[AdBlocker] Blocked popup from iframe');
          return null;
        };
      } catch (e) {
        // Cross-origin, sandbox handles it
      }
    };
  } catch (e) {
    // Silently fail for cross-origin iframes
  }
}