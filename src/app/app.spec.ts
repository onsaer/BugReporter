import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { ChromeMessageService } from './services/chrome-message.service';
import { BugContext } from './models/bug-report.model';

const mockContext: BugContext = {
  url: 'https://example.com',
  title: 'Example',
  timestamp: Date.now(),
  browser: { userAgent: 'TestAgent', language: 'en', platform: 'TestOS', vendor: 'TestVendor' },
  screen: { width: 1920, height: 1080, viewportWidth: 1280, viewportHeight: 720, devicePixelRatio: 1 },
  localStorage: {},
  sessionStorage: {},
  consoleErrors: [],
  networkErrors: [],
  angularState: null
};

const mockChromeMessageService: Partial<ChromeMessageService> = {
  requestContext: () => Promise.resolve(mockContext),
  requestScreenshot: () => Promise.resolve('data:image/png;base64,abc'),
  sendReport: () => Promise.resolve({ success: true, message: 'Report saved!' })
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ChromeMessageService, useValue: mockChromeMessageService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Bug Reporter');
  });

  it('should load context on init', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    expect(app.context()).toEqual(mockContext);
    expect(app.loadingContext()).toBe(false);
  });

  it('should load screenshot on init', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    expect(app.screenshot()).toBe('data:image/png;base64,abc');
    expect(app.loadingScreenshot()).toBe(false);
  });

  it('should show error when submitting without title', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    app.reportTitle = '';
    await app.submitReport();
    expect(app.sendStatus()).toBe('error');
    expect(app.statusMessage()).toContain('title');
  });

  it('should send report successfully', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    app.reportTitle = 'Test bug';
    app.reportDescription = 'Something is broken';
    app.reportSeverity = 'high';
    await app.submitReport();
    expect(app.sendStatus()).toBe('success');
    expect(app.statusMessage()).toBe('Report saved!');
  });

  it('should toggle raw context visibility', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.showRawContext()).toBe(false);
    app.toggleRawContext();
    expect(app.showRawContext()).toBe(true);
    app.toggleRawContext();
    expect(app.showRawContext()).toBe(false);
  });
});
