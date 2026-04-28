import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChromeMessageService } from './services/chrome-message.service';
import { BugContext, BugReport } from './models/bug-report.model';

type SendStatus = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  title = signal('Bug Reporter');
  context = signal<BugContext | null>(null);
  screenshot = signal<string>('');
  loadingContext = signal(true);
  loadingScreenshot = signal(true);
  sendStatus = signal<SendStatus>('idle');
  statusMessage = signal('');
  showRawContext = signal(false);

  reportTitle = '';
  reportDescription = '';
  reportSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  constructor(private chromeMessageService: ChromeMessageService) {}

  ngOnInit(): void {
    this.loadContext();
    this.loadScreenshot();
  }

  private loadContext(): void {
    this.chromeMessageService.requestContext()
      .then(ctx => {
        this.context.set(ctx);
        this.loadingContext.set(false);
      })
      .catch(() => {
        this.context.set(null);
        this.loadingContext.set(false);
      });
  }

  private loadScreenshot(): void {
    this.chromeMessageService.requestScreenshot()
      .then(shot => {
        this.screenshot.set(shot);
        this.loadingScreenshot.set(false);
      })
      .catch(() => {
        this.screenshot.set('');
        this.loadingScreenshot.set(false);
      });
  }

  get localStorageKeys(): string[] {
    const ctx = this.context();
    if (!ctx) return [];
    return Object.keys(ctx.localStorage);
  }

  get rawContextJson(): string {
    return JSON.stringify(this.context(), null, 2);
  }

  toggleRawContext(): void {
    this.showRawContext.update(v => !v);
  }

  async submitReport(): Promise<void> {
    if (!this.reportTitle.trim()) {
      this.sendStatus.set('error');
      this.statusMessage.set('Please enter a title for the bug report.');
      return;
    }

    const ctx = this.context();
    if (!ctx) {
      this.sendStatus.set('error');
      this.statusMessage.set('Context not yet loaded. Please wait.');
      return;
    }

    const report: BugReport = {
      title: this.reportTitle.trim(),
      description: this.reportDescription.trim(),
      severity: this.reportSeverity,
      context: {
        ...ctx,
        screenshot: this.screenshot()
      }
    };

    this.sendStatus.set('loading');
    this.statusMessage.set('');

    try {
      const result = await this.chromeMessageService.sendReport(report);
      this.sendStatus.set(result.success ? 'success' : 'error');
      this.statusMessage.set(result.message);
    } catch (err: unknown) {
      this.sendStatus.set('error');
      this.statusMessage.set(err instanceof Error ? err.message : 'Failed to send report.');
    }
  }
}
