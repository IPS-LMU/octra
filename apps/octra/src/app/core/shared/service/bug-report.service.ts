import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable, of } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { BugReporter } from '../../obj/BugAPI/BugReporter';
import { AppStorageService } from './appstorage.service';
import { SettingsService } from './settings.service';
import {
  BrowserInfo,
  getFileSize,
  SubscriptionManager,
} from '@octra/utilities';
import { LoginMode } from '../../store';
import { DateTime } from 'luxon';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { AudioService } from './audio.service';

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
  private fromDBLoaded = false;
  private subscrManager = new SubscriptionManager();
  private _console: ConsoleEntry[] = [];

  get console(): ConsoleEntry[] {
    return this._console;
  }

  constructor(
    private langService: TranslocoService,
    private appStorage: AppStorageService,
    private settService: SettingsService,
    private annotationStoreService: AnnotationStoreService,
    private audio: AudioService,
    private http: HttpClient
  ) {}

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
        this.appStorage.onlineSession?.currentProject?.name;
      result.octra.user = this.appStorage.snapshot.authentication.me!.username;
      result.octra.jobID = this.appStorage.onlineSession?.task?.id;
    }

    this.subscrManager.add(
      this.annotationStoreService.transcript$.subscribe({
        next: (transcript) => {
          const file = getFileSize(this.audio.audioManager.resource.size!);
          result.octra.audiofile_size = file.size + ' ' + file.label;
          result.octra.audiofile_duration =
            this.audio.audioManager.resource.info.duration.seconds;
          result.octra.audiofile_samplerate =
            this.audio.audioManager.resource.info.sampleRate;
          result.octra.audiofile_bitrate =
            this.audio.audioManager.resource.info.bitrate;
          result.octra.audiofile_channels =
            this.audio.audioManager.resource.info.channels;
          result.octra.audiofile_type =
            this.audio.audioManager.resource.extension;
          result.octra.levels = transcript!.levels.length;
          result.octra.currentlevel = transcript!.selectedLevelIndex;
          result.octra.segments = transcript!.currentLevel!.items.length;
        },
      })
    );

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
