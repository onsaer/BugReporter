import type { BugContext, BrowserInfo, ScreenInfo, StorageData, ConsoleError, NetworkError } from './app/models/bug-report.model';

// --- Console Error Interceptor ---
const capturedConsoleErrors: ConsoleError[] = [];
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]): void => {
  capturedConsoleErrors.push({
    message: args.map(a => {
      if (typeof a !== 'object' || a === null) return String(a);
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(' '),
    timestamp: Date.now()
  });
  originalConsoleError(...args);
};

// --- Network Error Interceptor ---
const capturedNetworkErrors: NetworkError[] = [];
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  try {
    const response = await originalFetch(input, init);
    if (!response.ok) {
      capturedNetworkErrors.push({
        url,
        status: response.status,
        statusText: response.statusText,
        timestamp: Date.now()
      });
    }
    return response;
  } catch (err: unknown) {
    capturedNetworkErrors.push({
      url,
      status: 0,
      statusText: err instanceof Error ? err.message : 'Network Error',
      timestamp: Date.now()
    });
    throw err;
  }
};

// --- Storage Reader (non-sensitive keys only) ---
function readStorage(storage: Storage): StorageData {
  const SENSITIVE_PATTERNS = /token|secret|password|pwd|pass|key|auth|credential/i;
  const data: StorageData = {};
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && !SENSITIVE_PATTERNS.test(k)) {
        const value = storage.getItem(k);
        if (value !== null) {
          data[k] = value.length > 200 ? value.substring(0, 200) + '…' : value;
        }
      }
    }
  } catch {
    // Access may be restricted on some pages
  }
  return data;
}

// --- Angular State Reader ---
function readAngularState(): unknown {
  try {
    const w = window as Window & { __ANGULAR_STATE__?: unknown; __NGRX_STATE__?: unknown };
    return w.__ANGULAR_STATE__ ?? w.__NGRX_STATE__ ?? null;
  } catch {
    return null;
  }
}

// --- Context Builder ---
function buildContext(): BugContext {
  const browser: BrowserInfo = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    vendor: navigator.vendor
  };

  const screen: ScreenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  };

  return {
    url: window.location.href,
    title: document.title,
    timestamp: Date.now(),
    browser,
    screen,
    localStorage: readStorage(window.localStorage),
    sessionStorage: readStorage(window.sessionStorage),
    consoleErrors: [...capturedConsoleErrors],
    networkErrors: [...capturedNetworkErrors],
    angularState: readAngularState()
  };
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener(
  (message: { action: string }, _sender: chrome.runtime.MessageSender, sendResponse: (response: BugContext) => void) => {
    if (message.action === 'GET_CONTEXT') {
      sendResponse(buildContext());
    }
    return true;
  }
);
