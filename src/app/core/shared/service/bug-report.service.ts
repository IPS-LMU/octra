import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import * as moment from 'moment';
import {Functions, isUnset} from '@octra/components';
import {Observable} from 'rxjs';
import {isArray} from 'rxjs/internal-compatibility';
import {AppInfo} from '../../../app.info';
import {BugReporter} from '../../obj/BugAPI/BugReporter';
import {BrowserInfo} from '../BrowserInfo';
import {AppStorageService} from './appstorage.service';
import {SettingsService} from './settings.service';
import {TranscriptionService} from './transcription.service';

export enum ConsoleType {
  LOG,
  INFO,
  WARN,
  ERROR
}

export interface ConsoleEntry {
  type: ConsoleType;
  timestamp: string;
  message: string;
}

export interface BugReportCredentials {
  auth_token: string;
  url: string;
}

@Injectable()
export class BugReportService {
  private reporter: BugReporter;
  private transcrService: TranscriptionService;
  private fromDBLoaded = false;

  private _console: ConsoleEntry[] = [];

  get console(): ConsoleEntry[] {
    return this._console;
  }

  constructor(private langService: TranslocoService,
              private appStorage: AppStorageService,
              private settService: SettingsService,
              private http: HttpClient) {
  }

  public init(transcrService: TranscriptionService) {
    this.transcrService = transcrService;
  }

  public addEntry(type: ConsoleType, message: any) {
    const consoleItem: ConsoleEntry = {
      type,
      timestamp: moment().format('DD.MM.YY HH:mm:ss'),
      message
    };

    this._console.push(consoleItem);
    if (this.fromDBLoaded) {
      this.appStorage.saveConsoleEntries(this._console);
    }
  }

  public clear() {
    this._console = [];
  }

  public addEntriesFromDB(entries: ConsoleEntry[]) {
    if (!isUnset(entries) && isArray(entries)) {
      if (entries.length > 50) {
        // crop down to 100 items
        entries = entries.slice(-50);
      }

      this._console = entries.concat([{
        type: 0,
        timestamp: moment().format('DD.MM.YY HH:mm:ss'),
        message: '--- AFTER RELOAD ---'
      }], this._console);
    }
    this.appStorage.saveConsoleEntries(this._console);
    this.fromDBLoaded = true;
  }

  public getPackage(): any {
    const result = {
      octra: {
        version: AppInfo.version,
        language: this.langService.getActiveLang(),
        signed_in: this.appStorage.LoggedIn,
        usemode: this.appStorage.usemode,
        url: window.location.href,
        lastUpdated: AppInfo.lastUpdate,
        project: null,
        user: null,
        jobID: null,
        audiofile_size: null,
        audiofile_duration: null,
        audiofile_samplerate: null,
        audiofile_bitrate: null,
        audiofile_channels: null,
        audiofile_type: null,
        levels: null,
        currentlevel: null,
        segments: null
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

    if (this.appStorage.usemode === 'online') {
      result.octra.project = this.appStorage.user.project;
      result.octra.user = this.appStorage.user.id;
      result.octra.jobID = this.appStorage.dataID;
    }

    if (!(this.transcrService === null || this.transcrService === undefined)) {
      const file = Functions.getFileSize(this.transcrService.audiofile.size);
      result.octra.audiofile_size = file.size + ' ' + file.label;
      result.octra.audiofile_duration = this.transcrService.audioManager.ressource.info.duration.seconds;
      result.octra.audiofile_samplerate = this.transcrService.audiofile.sampleRate;
      result.octra.audiofile_bitrate = this.transcrService.audioManager.ressource.info.bitrate;
      result.octra.audiofile_channels = this.transcrService.audioManager.ressource.info.channels;
      result.octra.audiofile_type = this.transcrService.audioManager.ressource.extension;
      result.octra.levels = this.transcrService.annotation.levels.length;
      result.octra.currentlevel = this.transcrService.selectedlevel;
      result.octra.segments = this.transcrService.currentlevel.segments.length;
    }

    return result;
  }

  public getText(): string {
    if (!isUnset(this.settService.appSettings)) {
      const bugreportSettings = this.settService.appSettings.octra.bugreport;

      for (const bugreporter of AppInfo.bugreporters) {
        if (bugreporter.name === bugreportSettings.name) {
          this.reporter = bugreporter;
        }
      }

      if (!(this.reporter === null || this.reporter === undefined)) {
        return this.reporter.getText(this.getPackage());
      }
    }
    return '';
  }

  sendReport(
    name: string, email: string, description: string, sendbugreport: boolean,
    credentials: BugReportCredentials, screenshots: any[]
  ): Observable<any> {
    const bugreportSettings = this.settService.appSettings.octra.bugreport;

    if (!(bugreportSettings === null || bugreportSettings === undefined) && bugreportSettings.enabled) {
      const auth_token = credentials.auth_token;
      const url = credentials.url;
      const form = {
        email,
        name,
        description
      };

      return this.reporter.sendBugReport(this.http, this.getPackage(), form, url, auth_token, sendbugreport, screenshots);
    }

    return null;
  }

}
