import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FeedbackRequestPropertiesDto } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { getFileSize, removeProperties } from '@octra/utilities';
import { BrowserInfo } from '@octra/web-media';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { LoginMode } from '../../store';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { AppStorageService } from './appstorage.service';
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

export interface ConsoleGroupEntry {
  label: string;
  timestamp: string;
  entries: ConsoleEntry[];
}

@Injectable()
export class BugReportService {
  private langService = inject(TranslocoService);
  private appStorage = inject(AppStorageService);
  private annotationStoreService = inject(AnnotationStoreService);
  private audio = inject(AudioService);
  private api = inject(OctraAPIService);

  private _console: (ConsoleEntry | ConsoleGroupEntry)[] = [];
  private readonly MAX_LOG_ENTRIES = 100;

  pkgText = '';

  get console(): (ConsoleEntry | ConsoleGroupEntry)[] {
    return this._console;
  }

  private startedGroup?: ConsoleGroupEntry;

  public addEntry(type: ConsoleType, message: any) {
    const consoleItem: ConsoleEntry = {
      type,
      timestamp: DateTime.now().toISO(),
      message,
    };

    if (this._console !== undefined) {
      if (!this.startedGroup) {
        this._console = [...this._console, consoleItem];
        if (this._console.length > this.MAX_LOG_ENTRIES) {
          this._console.splice(0, this._console.length - this.MAX_LOG_ENTRIES);
        }
        this.appStorage.consoleEntries = this._console;
      } else {
        this.addToGroup(type, message);
      }
    }
  }

  public beginGroup(label: string) {
    this.startedGroup = {
      label,
      timestamp: DateTime.now().toISO(),
      entries: [],
    };
  }

  public addToGroup(type: ConsoleType, message: any) {
    this.startedGroup?.entries.push({
      type,
      timestamp: DateTime.now().toISO(),
      message,
    });
  }

  public endGroup() {
    if (this._console && this.startedGroup) {
      this._console = [...this._console, this.startedGroup];
      this.startedGroup = undefined;
      if (this._console.length > this.MAX_LOG_ENTRIES) {
        this._console.splice(0, this._console.length - this.MAX_LOG_ENTRIES);
      }
      this.appStorage.consoleEntries = this._console;
    }
    this.startedGroup = undefined;
  }

  public clear() {
    this._console = [];
  }

  public addEntriesFromDB(entries: (ConsoleEntry | ConsoleGroupEntry)[]) {
    if (entries !== undefined && Array.isArray(entries) && entries.length > 0) {
      this._console = entries.concat(
        [
          {
            type: ConsoleType.INFO,
            timestamp: DateTime.now()
              .setLocale('de')
              .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            message: '--- AFTER RELOAD ---',
          },
        ],
        this._console,
      );
    }

    if (this._console.length > this.MAX_LOG_ENTRIES) {
      this._console.splice(0, this._console.length - this.MAX_LOG_ENTRIES);
    }
    this.appStorage.consoleEntries = this._console;
  }

  public getPackage(): {
    dto: FeedbackRequestPropertiesDto;
    protocol?: File;
  } {
    const protocol: any = {
      tool: {
        version: AppInfo.BUILD.version,
        language: this.langService.getActiveLang(),
        signed_in: this.appStorage.loggedIn,
        useMode: this.appStorage.useMode,
        url: window.location.href,
        lastUpdated: AppInfo.BUILD.timestamp,
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
    };

    const dto: FeedbackRequestPropertiesDto = {
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
    };

    if (this.appStorage.useMode === LoginMode.ONLINE) {
      protocol.tool.project =
        this.appStorage.onlineSession?.currentProject?.name;
      protocol.tool.user = this.appStorage.snapshot.authentication.me?.username;
      protocol.tool.jobID = this.appStorage.onlineSession?.task?.id;
    }

    if (this.annotationStoreService.transcript) {
      if (this.audio.audioManager) {
        const file = getFileSize(this.audio.audioManager.resource.size!);
        protocol.tool.audiofile_size = file.size + ' ' + file.label;
        protocol.tool.audiofile_duration =
          this.audio.audioManager.resource.info.duration.seconds;
        protocol.tool.audiofile_samplerate =
          this.audio.audioManager.resource.info.sampleRate;
        protocol.tool.audiofile_bitrate =
          this.audio.audioManager.resource.info.bitrate;
        protocol.tool.audiofile_channels =
          this.audio.audioManager.resource.info.channels;
        protocol.tool.audiofile_type =
          this.audio.audioManager.resource.extension;
      }
      protocol.tool.levels =
        this.annotationStoreService.transcript.levels.length;
      protocol.tool.currentlevel =
        this.annotationStoreService.transcript.selectedLevelIndex;
      protocol.tool.segments =
        this.annotationStoreService.transcript.currentLevel?.items.length;
    }

    this.pkgText = JSON.stringify(
      {
        ...dto,
        protocol,
      },
      null,
      2,
    );

    return {
      dto,
      protocol: new File(
        [JSON.stringify(protocol)],
        `Octra_procotol_${Date.now()}.json`,
        {
          type: 'application/json',
        },
      ),
    };
  }

  sendReport(
    name: string,
    email: string,
    message: string,
    sendProtocol: boolean,
    screenshots: any[],
  ): Observable<any> {
    const pkg = this.getPackage();
    let body: FeedbackRequestPropertiesDto = {
      ...pkg.dto,
      message: message ?? '',
      requester: {
        email,
        name,
      },
    };
    let protocol: File | undefined = pkg.protocol;

    if (!sendProtocol) {
      body = removeProperties(body, ['technicalInformation']);
      protocol = undefined;
    }

    return this.api.sendFeedback(
      body,
      protocol,
      screenshots?.map((a) => a.blob),
    );
  }
}
