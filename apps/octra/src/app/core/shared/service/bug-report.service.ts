import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, of } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { BugReporter } from '../../obj/BugAPI/BugReporter';
import { AppStorageService } from './appstorage.service';
import { SettingsService } from './settings.service';
import { TranscriptionService } from './transcription.service';
import { BrowserInfo, getFileSize } from '@octra/utilities';
import { LoginMode } from '../../store';
import { DateTime } from 'luxon';

export enum ConsoleType {
  LOG,
  INFO,
  WARN,
  ERROR,
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
  private reporter!: BugReporter;
  private transcrService!: TranscriptionService;
  private fromDBLoaded = false;

  private _console: ConsoleEntry[] = [];

  get console(): ConsoleEntry[] {
    return this._console;
  }

  constructor(
    private langService: TranslocoService,
    private appStorage: AppStorageService,
    private settService: SettingsService,
    private http: HttpClient
  ) {}

  public init(transcrService: TranscriptionService) {
    this.transcrService = transcrService;
  }

  public addEntry(type: ConsoleType, message: any) {
    const consoleItem: ConsoleEntry = {
      type,
      timestamp: DateTime.now()
        .setLocale('de')
        .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
      message,
    };

    if (this._console !== undefined) {
      this._console = [...this._console, consoleItem];
      this.appStorage.consoleEntries = this._console;
    }
  }

  public clear() {
    this._console = [];
  }

  public addEntriesFromDB(entries: ConsoleEntry[]) {
    if (entries !== undefined && Array.isArray(entries) && entries.length > 0) {
      if (entries.length > 50) {
        // crop down to 100 items
        entries = entries.slice(-50);
      }

      this._console = entries.concat(
        [
          {
            type: 0,
            timestamp: DateTime.now()
              .setLocale('de')
              .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            message: '--- AFTER RELOAD ---',
          },
        ],
        this._console
      );
    }
    this.appStorage.consoleEntries = this._console;
    this.fromDBLoaded = true;
  }

  public getPackage(): any {
    const result: any = {
      octra: {
        version: AppInfo.version,
        language: this.langService.getActiveLang(),
        signed_in: this.appStorage.loggedIn,
        useMode: this.appStorage.useMode,
        url: window.location.href,
        lastUpdated: AppInfo.lastUpdate,
        project: undefined,
        user: undefined,
        jobID: undefined,
        audiofile_size: undefined,
        audiofile_duration: undefined,
        audiofile_samplerate: undefined,
        audiofile_bitrate: undefined,
        audiofile_channels: undefined,
        audiofile_type: undefined,
        levels: undefined,
        currentlevel: undefined,
        segments: undefined,
      },
      system: {
        os: {
          name: BrowserInfo.os.family,
          version: BrowserInfo.os.version,
        },
        browser: BrowserInfo.browser + ' ' + BrowserInfo.version,
        version: BrowserInfo.os.version,
      },
      entries: this._console,
    };

    if (this.appStorage.useMode === LoginMode.ONLINE) {
      result.octra.project =
        this.appStorage.onlineSession!.currentProject!.name!;
      result.octra.user = this.appStorage.snapshot.authentication.me!.username;
      result.octra.jobID = this.appStorage.transcriptID;
    }

    if (!(this.transcrService === undefined)) {
      const file = getFileSize(this.transcrService.audiofile.size);
      result.octra.audiofile_size = file.size + ' ' + file.label;
      result.octra.audiofile_duration =
        this.transcrService.audioManager.resource.info.duration.seconds;
      result.octra.audiofile_samplerate =
        this.transcrService.audiofile.sampleRate;
      result.octra.audiofile_bitrate =
        this.transcrService.audioManager.resource.info.bitrate;
      result.octra.audiofile_channels =
        this.transcrService.audioManager.resource.info.channels;
      result.octra.audiofile_type =
        this.transcrService.audioManager.resource.extension;
      result.octra.levels = this.transcrService.annotation.levels.length;
      result.octra.currentlevel = this.transcrService.selectedlevel;
      result.octra.segments = this.transcrService.currentlevel!.segments.length;
    }

    return result;
  }

  public getText(): string {
    if (this.settService.appSettings !== undefined) {
      const bugreportSettings = this.settService.appSettings.octra.bugreport;

      for (const bugreporter of AppInfo.bugreporters) {
        if (bugreporter.name === bugreportSettings.name) {
          this.reporter = bugreporter;
        }
      }

      if (!(this.reporter === undefined)) {
        return this.reporter.getText(this.getPackage());
      }
    }
    return '';
  }

  sendReport(
    name: string,
    email: string,
    description: string,
    sendbugreport: boolean,
    credentials: BugReportCredentials,
    screenshots: any[]
  ): Observable<any> {
    const bugreportSettings = this.settService.appSettings.octra.bugreport;

    if (!(bugreportSettings === undefined) && bugreportSettings.enabled) {
      const auth_token = credentials.auth_token;
      const url = credentials.url;
      const form = {
        email,
        name,
        description,
      };

      return this.reporter.sendBugReport(
        this.http,
        this.getPackage(),
        form,
        url,
        auth_token,
        sendbugreport,
        screenshots
      );
    }

    return of(undefined);
  }
}
