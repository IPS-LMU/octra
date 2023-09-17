import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { AppStorageService } from './appstorage.service';
import { getFileSize, SubscriptionManager } from '@octra/utilities';
import { LoginMode } from '../../store';
import { DateTime } from 'luxon';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { AudioService } from './audio.service';
import { BrowserInfo } from '@octra/web-media';
import { OctraAPIService, removeProperties } from '@octra/ngx-octra-api';
import { FeedbackRequestPropertiesDto } from '@octra/api-types';

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
  private fromDBLoaded = false;
  private subscrManager = new SubscriptionManager();
  private _console: ConsoleEntry[] = [];

  pkgText = "";

  get console(): ConsoleEntry[] {
    return this._console;
  }

  constructor(
    private langService: TranslocoService,
    private appStorage: AppStorageService,
    private annotationStoreService: AnnotationStoreService,
    private audio: AudioService,
    private api: OctraAPIService
  ) {}

  public addEntry(type: ConsoleType, message: any) {
    const consoleItem: ConsoleEntry = {
      type,
      timestamp: DateTime.now().toISO()!,
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

  public getPackage(): FeedbackRequestPropertiesDto {
    const result: FeedbackRequestPropertiesDto = {
      type: 'bug',
      technicalInformation: {
        os: {
          name: BrowserInfo.os.family,
          version: BrowserInfo.os.version,
        },
        browser: {
          name: BrowserInfo.browser + ' ' + BrowserInfo.version,
          version: BrowserInfo.os.version,
        },
      },
      protocol: {
        tool: {
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
        entries: this._console,
      },
    };

    if (this.appStorage.useMode === LoginMode.ONLINE) {
      result.protocol!.tool.project =
        this.appStorage.onlineSession?.currentProject?.name;
      result.protocol!.tool.user =
        this.appStorage.snapshot.authentication.me?.username;
      result.protocol!.tool.jobID = this.appStorage.onlineSession?.task?.id;
    }

    if(this.annotationStoreService.transcript){
      if(this.audio.audioManager){
        const file = getFileSize(this.audio.audioManager.resource.size!);
        result.protocol!.tool.audiofile_size = file.size + ' ' + file.label;
        result.protocol!.tool.audiofile_duration =
          this.audio.audioManager.resource.info.duration.seconds;
        result.protocol!.tool.audiofile_samplerate =
          this.audio.audioManager.resource.info.sampleRate;
        result.protocol!.tool.audiofile_bitrate =
          this.audio.audioManager.resource.info.bitrate;
        result.protocol!.tool.audiofile_channels =
          this.audio.audioManager.resource.info.channels;
        result.protocol!.tool.audiofile_type =
          this.audio.audioManager.resource.extension;
      }
      result.protocol!.tool.levels =
        this.annotationStoreService.transcript.levels.length;
      result.protocol!.tool.currentlevel =
        this.annotationStoreService.transcript.selectedLevelIndex;
      result.protocol!.tool.segments =
        this.annotationStoreService.transcript.currentLevel?.items.length;
    }

    this.pkgText = JSON.stringify(result, null, 2);

    return result;
  }

  sendReport(
    name: string,
    email: string,
    message: string,
    sendProtocol: boolean,
    screenshots: any[]
  ): Observable<any> {
    const pkg = this.getPackage();
    let body: FeedbackRequestPropertiesDto = {
      ...pkg,
      message,
      requester: {
        email,
        name,
      },
    };

    if (!sendProtocol) {
      body = removeProperties(body, ['technicalInformation', 'protocol']);
    }

    return this.api.sendFeedback(
      body,
      screenshots.map((a) => a.blob)
    );
  }
}
