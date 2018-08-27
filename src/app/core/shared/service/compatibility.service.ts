import {Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {SettingsService} from './index';

declare var Modernizr: any;

@Injectable({
  providedIn: 'root'
})
export class CompatibilityService {
  public rules: {
    name: string;
    description: string;
    help: string;
    state: 'processing' | 'ok' | 'failed'
  }[] = [
    {
      name: 'browser',
      description: 'Browser is supported.',
      state: 'processing',
      help: `Please make sure, that you are using the latest version of your browser. It is recommended using Chrome.
<br/>Supported Browsers:<br/>`
    },
    {
      name: 'cookies',
      description: 'Cookies are enabled on this browser.',
      state: 'processing',
      help: 'Please make sure, that cookies are enabled in your browser settings. Don\'t use the incognito mode or other private mode.'
    },
    {
      name: 'canvas',
      description: 'Browser supports canvas.',
      state: 'processing',
      help: ''
    },
    {
      name: 'canvastext',
      description: 'Browser supports rendering text on canvas.',
      state: 'processing',
      help: ''
    },
    {
      name: 'webaudio',
      description: 'Browser supports Web Audio API.',
      state: 'processing',
      help: ''
    },
    {
      name: 'promises',
      description: 'Browser supports ES6 Promises.',
      state: 'processing',
      help: ''
    },
    {
      name: 'indexeddb',
      description: 'Browser supports IndexedDB.',
      state: 'processing',
      help: ''
    },
    {
      name: 'bloburls',
      description: 'Browser supports BlobURL.',
      state: 'processing',
      help: ''
    },
    {
      name: 'filereader',
      description: 'Browser supports FileReader.',
      state: 'processing',
      help: ''
    }
  ];

  constructor(private settingsService: SettingsService) {
  }

  public isValidBrowser(allowed_browsers: any[]): boolean {

    for (let i = 0; i < allowed_browsers.length; i++) {
      const browser = allowed_browsers[i];
      if (browser.name === BrowserInfo.browser) {
        return true;
      }
    }

    return false;
  }

  testCompability(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.rules[0].help += this.getValidBrowsers();
      let valid = true;

      const promises = [];
      for (let i = 0; i < this.rules.length; i++) {
        const rule = this.rules[i];
        promises.push(this.checkFeature(rule.name));
      }

      Promise.all(promises).then((values) => {
        for (let i = 0; i < values.length; i++) {
          this.rules[i].state = (values[i]) ? 'ok' : 'failed';
          if (!values[i]) {
            valid = false;
          }
        }
        resolve(valid);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  getValidBrowsers(): string {
    let result = '';

    if (!(this.settingsService.app_settings === null || this.settingsService.app_settings === undefined)) {
      for (let i = 0; i < this.settingsService.app_settings.octra.allowed_browsers.length; i++) {
        const browser = this.settingsService.app_settings.octra.allowed_browsers[i];
        result += browser.name;
        if (i < this.settingsService.app_settings.octra.allowed_browsers.length - 1) {
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
          Modernizr.on(name, (result) => {
            resolve(result);
          });
        } else {
          resolve(Modernizr['' + name]);
        }
      } else {
        if (this.settingsService.app_settings.octra.allowed_browsers.length > 0) {
          const valid = this.isValidBrowser(this.settingsService.app_settings.octra.allowed_browsers);
          resolve(valid);
        } else {
          resolve(true);
        }
      }
    });
  }
}
