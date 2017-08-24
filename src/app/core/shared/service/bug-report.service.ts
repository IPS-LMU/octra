import {Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {TranslateService} from '@ngx-translate/core';
import {AppInfo} from '../../../app.info';
import {AppStorageService} from './appstorage.service';
import {Http, Response} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {MantisBugReporter} from '../../obj/BugAPI/MantisBugReporter';
import {SettingsService} from './settings.service';
import {isNullOrUndefined} from 'util';

export enum ConsoleType {
  LOG,
  INFO,
  WARN,
  ERROR
}

export interface ConsoleEntry {
  type: ConsoleType;
  message: string;
}

@Injectable()
export class BugReportService {
  get console(): ConsoleEntry[] {
    return this._console;
  }

  private _console: ConsoleEntry[] = [];

  constructor(private langService: TranslateService,
              private sessService: AppStorageService,
              private settService: SettingsService,
              private http: Http) {
  }

  public addEntry(type: ConsoleType, message: string) {
    const console: ConsoleEntry = {
      type: type,
      message: message
    };

    this._console.push(console);
  }

  public clear() {
    this._console = [];
  }

  public getPackage(): any {
    return {
      octra: {
        version: AppInfo.version,
        language: this.langService.currentLang,
        signed_in: this.sessService.logged_in,
        dataid: this.sessService.data_id,
        localmode: this.sessService.uselocalmode
      },
      system: {
        os: {
          name: BrowserInfo.os.family,
          version: BrowserInfo.os.version
        },
        browser: BrowserInfo.browser + ' ' + BrowserInfo.version,
        version: BrowserInfo.os.version
      },
      entries: this._console
    };
  }

  public getText(): string {
    const reporter = new MantisBugReporter();
    return reporter.getText(this.getPackage());
  }

  sendReport(email: string, description: string, sendbugreport: boolean, credentials: {
    auth_token: string,
    url: string
  }): Observable<Response> {
    const bugreport_settings = this.settService.app_settings.octra.bugreport;

    if (!isNullOrUndefined(bugreport_settings) && bugreport_settings.enabled) {
      for (let i = 0; i < AppInfo.bugreporters.length; i++) {
        const bugreporter = AppInfo.bugreporters[i];
        if (bugreporter.name === bugreport_settings.name) {
          const auth_token = credentials.auth_token;
          const url = credentials.url;
          const form = {
            email: email,
            description: description
          };

          return bugreporter.sendBugReport(this.http, this.getPackage(), form, url, auth_token, sendbugreport);
        }
      }
    }

    return null;
  }

}
