import {Injectable} from '@angular/core';
import {BrowserInfo} from '../BrowserInfo';
import {TranslateService} from '@ngx-translate/core';
import {AppInfo} from '../../../app.info';
import {AppStorageService} from './appstorage.service';
import {Observable} from 'rxjs/Observable';
import {SettingsService} from './settings.service';
import {BugReporter} from '../../obj/BugAPI/BugReporter';
import {TranscriptionService} from './transcription.service';
import {Functions} from '../Functions';
import {HttpClient} from '@angular/common/http';

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
  private reporter: BugReporter;
  private transcrService: TranscriptionService;

  private _console: ConsoleEntry[] = [];

  get console(): ConsoleEntry[] {
    return this._console;
  }

  constructor(private langService: TranslateService,
              private appStorage: AppStorageService,
              private settService: SettingsService,
              private http: HttpClient) {
  }

  public init(transcrService: TranscriptionService) {
    this.transcrService = transcrService;
  }

  public addEntry(type: ConsoleType, message: any) {
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
    const result = {
      octra: {
        version: AppInfo.version,
        language: this.langService.currentLang,
        signed_in: this.appStorage.LoggedIn,
        dataid: this.appStorage.data_id,
        usemode: this.appStorage.usemode,
        url: window.location.href,
        lastUpdated: AppInfo.lastUpdate
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

    if (!(this.transcrService === null || this.transcrService === undefined)) {
      const file = Functions.getFileSize(this.transcrService.audiofile.size);
      result.octra['audiofile_size'] = file.size + ' ' + file.label;
      result.octra['audiofile_duration'] = this.transcrService.audiomanager.ressource.info.duration.browserSample.seconds;
      result.octra['audiofile_samplerate'] = this.transcrService.audiofile.samplerate;
      result.octra['audiofile_bitrate'] = this.transcrService.audiomanager.ressource.info.bitrate;
      result.octra['audiofile_channels'] = this.transcrService.audiomanager.ressource.info.channels;
      result.octra['audiofile_type'] = this.transcrService.audiomanager.ressource.extension;
      result.octra['levels'] = this.transcrService.annotation.levels.length;
      result.octra['currentlevel'] = this.transcrService.selectedlevel;
      result.octra['segments'] = this.transcrService.currentlevel.segments.length;
    }

    return result;
  }

  public getText(): string {
    const bugreport_settings = this.settService.app_settings.octra.bugreport;

    for (let i = 0; i < AppInfo.bugreporters.length; i++) {
      const bugreporter = AppInfo.bugreporters[i];
      if (bugreporter.name === bugreport_settings.name) {
        this.reporter = bugreporter;
      }
    }

    if (!(this.reporter === null || this.reporter === undefined)) {
      return this.reporter.getText(this.getPackage());
    }
    return '';
  }

  sendReport(email: string, description: string, sendbugreport: boolean, credentials: {
    auth_token: string,
    url: string
  }): Observable<any> {
    const bugreport_settings = this.settService.app_settings.octra.bugreport;

    if (!(bugreport_settings === null || bugreport_settings === undefined) && bugreport_settings.enabled) {
      const auth_token = credentials.auth_token;
      const url = credentials.url;
      const form = {
        email: email,
        description: description
      };

      return this.reporter.sendBugReport(this.http, this.getPackage(), form, url, auth_token, sendbugreport);
    }

    return null;
  }

}
