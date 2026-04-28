import { Injectable } from '@angular/core';
import { BugContext, BugReport } from '../models/bug-report.model';

declare const chrome: any;

@Injectable({
  providedIn: 'root'
})
export class ChromeMessageService {

  requestContext(): Promise<BugContext> {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'));
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_CONTEXT' }, (response: BugContext) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });
    });
  }

  requestScreenshot(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'CAPTURE_SCREENSHOT' }, (response: { screenshot?: string; error?: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response?.screenshot ?? '');
      });
    });
  }

  sendReport(report: BugReport): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'SEND_REPORT', payload: report }, (response: { success: boolean; message: string }) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  }
}
