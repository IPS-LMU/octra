import { inject, Injectable } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { FeedbackRequestPropertiesDto } from '@octra/api-types';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { getFileSize, removeProperties } from '@octra/utilities';
import { BrowserInfo } from '@octra/web-media';
import { Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { LoginMode } from '../../store';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { AppStorageService } from './appstorage.service';
import { AudioService } from './audio.service';
import { ConsoleLoggingService } from '@octra/ngx-components';

@Injectable()
export class BugReportService {
  private langService = inject(TranslocoService);
  private appStorage = inject(AppStorageService);
  private consoleService = inject(ConsoleLoggingService);
  private annotationStoreService = inject(AnnotationStoreService);
  private audio = inject(AudioService);
  private api = inject(OctraAPIService);

  pkgText = '';


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
      entries: this.consoleService.console,
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
