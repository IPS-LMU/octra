import { inject, Injectable } from '@angular/core';
import { BrowserInfo } from '@octra/web-media';
import { SettingsService } from './index';

declare let Modernizr: any;

@Injectable({
  providedIn: 'root',
})
export class CompatibilityService {
  private settingsService = inject(SettingsService);

  public rules: {
    name: string;
    description: string;
    help: string;
    state: 'processing' | 'ok' | 'failed';
  }[] = [
    {
      name: 'browser',
      description: 'Browser is supported.',
      state: 'processing',
      help: `Please make sure, that you are using the latest version of your browser. It is recommended using Chrome.
<br/>Supported Browsers: `,
    },
    {
      name: 'cookies',
      description: 'Cookies are enabled on this browser.',
      state: 'processing',
      help: "Please make sure, that cookies are enabled in your browser settings. Don't use the incognito mode or other private mode.",
    },
    {
      name: 'canvas',
      description: 'Browser supports canvas.',
      state: 'processing',
      help: '',
    },
    {
      name: 'canvastext',
      description: 'Browser supports rendering text on canvas.',
      state: 'processing',
      help: '',
    },
    {
      name: 'webaudio',
      description: 'Browser supports Web Audio API.',
      state: 'processing',
      help: '',
    },
    {
      name: 'promises',
      description: 'Browser supports ES6 Promises.',
      state: 'processing',
      help: '',
    },
    {
      name: 'indexeddb',
      description: 'Browser supports IndexedDB.',
      state: 'processing',
      help: '',
    },
    {
      name: 'bloburls',
      description: 'Browser supports BlobURL.',
      state: 'processing',
      help: '',
    },
    {
      name: 'filereader',
      description: 'Browser supports FileReader.',
      state: 'processing',
      help: '',
    },
  ];

  supportedBrowsers = '';

  public isValidBrowser(allowedBrowsers: any[]): boolean {
    for (const browser of allowedBrowsers) {
      if (browser.name === BrowserInfo.browser) {
        return true;
      }
    }

    return false;
  }

  testCompability(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.supportedBrowsers = this.getValidBrowsers();
      let valid = true;

      const promises = [];
      for (const rule of this.rules) {
        promises.push(this.checkFeature(rule.name));
      }

      Promise.all(promises)
        .then((values) => {
          for (let i = 0; i < values.length; i++) {
            this.rules[i].state = values[i] ? 'ok' : 'failed';
            if (!values[i]) {
              valid = false;
            }
          }
          resolve(valid);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getValidBrowsers(): string {
    let result = '';

    if (
      !(
        this.settingsService.appSettings === undefined ||
        this.settingsService.appSettings === undefined
      )
    ) {
      for (
        let i = 0;
        i < this.settingsService.appSettings.octra.allowed_browsers.length;
        i++
      ) {
        const browser =
          this.settingsService.appSettings.octra.allowed_browsers[i];
        result += browser.name;
        if (
          i <
          this.settingsService.appSettings.octra.allowed_browsers.length - 1
        ) {
          result += ', ';
        }
      }
    }

    return result;
  }

  public checkFeature(name: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (name !== 'browser') {
        if (name === 'indexeddb') {
          Modernizr.on(name, (result: any) => {
            resolve(result);
          });
        } else {
          resolve(Modernizr['' + name]);
        }
      } else {
        if (
          this.settingsService.appSettings.octra.allowed_browsers.length > 0
        ) {
          const valid = this.isValidBrowser(
            this.settingsService.appSettings.octra.allowed_browsers,
          );
          resolve(valid);
        } else {
          resolve(true);
        }
      }
    });
  }
}
