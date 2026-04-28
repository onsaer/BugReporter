export interface BrowserInfo {
  userAgent: string;
  language: string;
  platform: string;
  vendor: string;
}

export interface ScreenInfo {
  width: number;
  height: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

export interface StorageData {
  [key: string]: string;
}

export interface ConsoleError {
  message: string;
  timestamp: number;
}

export interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  timestamp: number;
}

export interface BugContext {
  url: string;
  title: string;
  timestamp: number;
  browser: BrowserInfo;
  screen: ScreenInfo;
  localStorage: StorageData;
  sessionStorage: StorageData;
  consoleErrors: ConsoleError[];
  networkErrors: NetworkError[];
  angularState: unknown;
  screenshot?: string;
}

export interface BugReport {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: BugContext;
}
