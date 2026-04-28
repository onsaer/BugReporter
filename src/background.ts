import type { BugReport } from './app/models/bug-report.model';

interface MessagePayload {
  action: string;
  payload?: BugReport;
}

interface ScreenshotResponse {
  screenshot?: string;
  error?: string;
}

interface SendReportResponse {
  success: boolean;
  message: string;
}

// --- Screenshot capture ---
async function captureScreenshot(): Promise<ScreenshotResponse> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.windowId) {
      return { error: 'No active tab found' };
    }
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    return { screenshot: dataUrl };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Screenshot failed' };
  }
}

// --- Report sender ---
async function sendReport(report: BugReport): Promise<SendReportResponse> {
  try {
    const stored = await chrome.storage.local.get('bugReports');
    const reports: BugReport[] = (stored['bugReports'] as BugReport[] | undefined) ?? [];
    reports.push(report);
    await chrome.storage.local.set({ bugReports: reports });

    // In a real deployment, replace this with an actual API call:
    // const response = await fetch('https://your-api.example.com/bug-reports', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(report)
    // });
    // if (!response.ok) throw new Error(`HTTP ${response.status}`);

    console.log('[BugReporter] Report stored locally:', report.title);
    return { success: true, message: 'Report saved! (Configure API endpoint in background.ts to send to your backend.)' };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to send report' };
  }
}

// --- Message handler ---
chrome.runtime.onMessage.addListener(
  (message: MessagePayload, _sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
    if (message.action === 'CAPTURE_SCREENSHOT') {
      captureScreenshot().then(sendResponse);
      return true;
    }

    if (message.action === 'SEND_REPORT' && message.payload) {
      sendReport(message.payload).then(sendResponse);
      return true;
    }

    return false;
  }
);
