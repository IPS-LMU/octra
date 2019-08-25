import {Injectable} from '@angular/core';
import {ASRLanguage, ASRSettings} from '../../obj/Settings';
import {SettingsService} from './settings.service';
import {AppStorageService} from './appstorage.service';
import {isNullOrUndefined} from '../Functions';
import {HttpClient} from '@angular/common/http';
import {FileInfo} from '../../../media-components/obj/fileInfo';
import * as X2JS from 'x2js';
import {AudioService} from './audio.service';
import {WavFormat} from '../../../media-components/obj/media/audio/AudioFormats';
import {Subject} from 'rxjs';
import {AudioChunk, AudioManager} from '../../../media-components/obj/media/audio/AudioManager';

@Injectable({
  providedIn: 'root'
})
export class AsrService {
  get queue(): ASRQueue {
    return this._queue;
  }

  get selectedLanguage(): ASRLanguage {
    return this._selectedLanguage;
  }

  set selectedLanguage(value: ASRLanguage) {
    this._selectedLanguage = value;
    this.appStorage.asrSelectedLanguage = value.code;
    this.appStorage.asrSelectedService = value.asr;
  }

  private _selectedLanguage: ASRLanguage = null;
  private _queue: ASRQueue;

  public resultRetrieved = new Subject<{
    sampleStart: number,
    sampleLength: number,
    text: string
  }>();

  public get asrSettings(): ASRSettings {
    return this.settingsService.appSettings.octra.plugins.asr;
  }

  constructor(private settingsService: SettingsService, private appStorage: AppStorageService, private httpClient: HttpClient,
              private audioService: AudioService) {
  }

  public init() {
    this._queue = new ASRQueue(this.asrSettings, this.audioService.audiomanagers[0], this.httpClient);
  }

  public getLanguageByCode(code: string, asr: string): ASRLanguage {
    if (isNullOrUndefined(asr) || isNullOrUndefined(code)) {
      return null;
    }

    return this.asrSettings.languages.find((a) => {
      return a.code === code && a.asr === asr;
    });
  }

  public getServiceInformation(serviceProvider: string) {
    if (!(this.asrSettings.services === null || this.asrSettings.services === undefined)) {
      return this.asrSettings.services.find((a) => {
        return a.provider === serviceProvider;
      });
    }

    return undefined;
  }

  public startASR() {
    this._queue.start();
  }

  public addToQueue(audiochunk: AudioChunk) {
    return this.queue.add(new ASRQueueItem(audiochunk, this.queue, this.selectedLanguage));
  }

  public stopASR() {
    this._queue.stop();
  }
}

class ASRQueue {
  get statistics(): { running: number; stopped: number; finished: number; failed: number } {
    return this._statistics;
  }

  get audiomanager(): AudioManager {
    return this._audiomanager;
  }

  get status(): ASRProcessStatus {
    return this._status;
  }

  get httpClient(): HttpClient {
    return this._httpClient;
  }

  get asrSettings(): ASRSettings {
    return this._asrSettings;
  }

  private queue: ASRQueueItem[];
  private readonly _asrSettings: ASRSettings;
  private readonly _httpClient: HttpClient;
  private _status: ASRProcessStatus;
  private readonly _audiomanager: AudioManager;

  public readonly itemChange: Subject<ASRQueueItem>;

  private _statistics = {
    running: 0,
    stopped: 0,
    failed: 0,
    finished: 0
  };

  private readonly MAX_PARALLEL_ITEMS = 3;

  public get length(): number {
    return this.queue.length;
  }

  constructor(asrSettings: ASRSettings, audioManager: AudioManager, httpClient: HttpClient) {
    this._asrSettings = asrSettings;
    this._httpClient = httpClient;
    this.queue = [];
    this._status = ASRProcessStatus.IDLE;
    this._audiomanager = audioManager;

    this.itemChange = new Subject<ASRQueueItem>();
  }

  public add(queueItem: ASRQueueItem) {
    const found = this.queue.find((a) => {
      return a.id === queueItem.id;
    }) !== undefined;

    if (!found) {
      this.queue.push(queueItem);
    } else {
      console.error(Error('QueueItem with id ' + queueItem.id + ' already added!'));
    }
  }

  public remove(id: number) {
    const index = this.queue.findIndex((a) => {
      return a.id === id;
    });

    if (index > -1) {
      this.queue.splice(index, 1);
    } else {
      console.error(`coulld not remove queueItem with id ${id}`);
    }
  }

  public start() {
    this._status = ASRProcessStatus.STARTED;
    this._statistics = {
      failed: 0,
      running: 0,
      stopped: 0,
      finished: 0
    };

    this.startNext();
  }

  private startNext() {
    console.log(`start next...`);
    if (this.status === ASRProcessStatus.STARTED) {
      if (this._statistics.running < this.MAX_PARALLEL_ITEMS) {
        const nextItem = this.getFirstFreeItem();

        if (nextItem !== undefined) {
          console.log(`start next: ${nextItem.id}`);
          if (nextItem.startProcessing()) {
            this.updateStatistics({
              old: ASRProcessStatus.IDLE,
              new: ASRProcessStatus.STARTED
            });
            this.itemChange.next(nextItem);
            nextItem.statusChange.subscribe((status) => {
                this.updateStatistics(status);

                if (status.new === ASRProcessStatus.FINISHED) {
                  // retrieve result
                  console.log(`item finished: ${nextItem.id}`);
                  console.log(nextItem.result);
                  console.log(`-----------`);
                }
                this.itemChange.next(nextItem);
              },
              (error) => {
              },
              () => {
              });
          } else {
            nextItem.changeStatus(ASRProcessStatus.FAILED);
          }
        }

        setTimeout(() => {
          this.startNext();
        }, 1000);
      } else {
        setTimeout(() => {
          this.startNext();
        }, 1000);
      }
    }
  }

  private getFirstFreeItem(): ASRQueueItem | undefined {
    return this.queue.find((a) => {
      return a.status === ASRProcessStatus.IDLE;
    });
  }

  private updateStatistics(status: { old: ASRProcessStatus, new: ASRProcessStatus }) {
    switch (status.old) {
      case ASRProcessStatus.FAILED:
        this._statistics.failed = Math.max(0, this._statistics.failed - 1);
        break;
      case ASRProcessStatus.STARTED:
        this._statistics.running = Math.max(0, this._statistics.running - 1);
        break;
      case ASRProcessStatus.FINISHED:
        this._statistics.finished = Math.max(0, this._statistics.finished - 1);
        break;
      case ASRProcessStatus.STOPPED:
        this._statistics.stopped = Math.max(0, this._statistics.stopped - 1);
        break;
    }

    switch (status.new) {
      case ASRProcessStatus.FAILED:
        this._statistics.failed += 1;
        break;
      case ASRProcessStatus.STARTED:
        this._statistics.running += 1;
        break;
      case ASRProcessStatus.FINISHED:
        this._statistics.finished += 1;
        break;
      case ASRProcessStatus.STOPPED:
        this._statistics.stopped += 1;
        break;
    }
  }

  public stop() {
    this._status = ASRProcessStatus.STOPPED;
    this.itemChange.complete();
  }
}

export class ASRQueueItem {
  get result(): string {
    return this._result;
  }

  get selectedLanguage(): ASRLanguage {
    return this._selectedLanguage;
  }

  get statusChange(): Subject<{
    old: ASRProcessStatus,
    new: ASRProcessStatus
  }> {
    return this._statusChange;
  }

  get status(): ASRProcessStatus {
    return this._status;
  }

  get time(): { sampleStart: number; sampleLength: number } {
    return this._time;
  }

  get id(): number {
    return this._id;
  }

  private static counter = 1;

  private readonly _id: number;
  private readonly _time: {
    sampleStart: number;
    sampleLength: number;
  };
  private _status: ASRProcessStatus;
  private readonly _statusChange: Subject<{
    old: ASRProcessStatus,
    new: ASRProcessStatus
  }>;
  private parent: ASRQueue;
  private _selectedLanguage: ASRLanguage;
  private _result: string;

  constructor(audioChunk: AudioChunk, asrQueue: ASRQueue, selectedLanguage: ASRLanguage) {
    this._id = ASRQueueItem.counter++;
    this._time = {
      sampleStart: audioChunk.time.start.originalSample.value,
      sampleLength: audioChunk.time.duration.originalSample.value
    };
    this._status = ASRProcessStatus.IDLE;
    this._statusChange = new Subject<{
      old: ASRProcessStatus,
      new: ASRProcessStatus
    }>();
    this.parent = asrQueue;
    this._selectedLanguage = selectedLanguage;
  }

  public changeStatus(newStatus: ASRProcessStatus) {
    if (this._status !== newStatus) {
      const old = this._status;
      this._status = newStatus;
      this._statusChange.next({
        old,
        new: this._status
      });
      console.log(`send change status`);
      console.log({
        old,
        new: this._status
      });
    }
  }

  public startProcessing(): boolean {
    if (this.status !== ASRProcessStatus.STARTED) {
      this.transcribeSignalWithASR();
      return true;
    }
    return false;
  }

  private uploadFile(file: File, language: ASRLanguage): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const url = `${language.host}uploadFileMulti`;
      const form: FormData = new FormData();
      form.append('file0', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.onerror = (e) => {
        reject(e);
      };

      xhr.onloadend = (e) => {
        const result = (e.currentTarget as any).responseText;
        console.log(result);
        const x2js = new X2JS();
        let json: any = x2js.xml2js(result);
        console.log(json);
        json = json.UploadFileMultiResponse;

        if (json.success === 'true') {
          // TODO set urls to results only
          // json attribute entry is an object
          resolve(json.fileList.entry['value']);
        } else {
          reject(json['message']);
        }
      };
      xhr.send(form);
    });
  }

  private callASR(languageObject: ASRLanguage, audioURL: string, timestamp: number): Promise<File> {
    return new Promise<File>((resolve, reject) => {
      const asrUrl = this.parent.asrSettings.calls[0].replace('{{host}}', languageObject.host)
        .replace('{{audioURL}}', audioURL)
        .replace('{{asrType}}', languageObject.asr)
        .replace('{{language}}', languageObject.code);

      console.log(`Call ${languageObject.asr}ASR:`);
      console.log(audioURL);
      this.parent.httpClient.post(asrUrl, {}, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'text'
      }).subscribe((result: string) => {
          console.log(`XML Result:`);
          console.log(result);
          // convert result to json
          const x2js = new X2JS();
          let json: any = x2js.xml2js(result);
          json = json.WebServiceResponseLink;

          if (json.success === 'true') {
            const file = FileInfo.fromURL(json.downloadLink, `OCTRA_ASRqueueItem_${this._id}.txt`, 'text/plain');
            file.updateContentFromURL(this.parent.httpClient).then(() => {
              // add messages to protocol
              resolve(file.file);
            }).catch((error) => {
              reject(error);
            });
          } else {
            reject(json.output);
          }
        },
        (error) => {
          reject(error.message);
        });
    });
  }

  public transcribeSignalWithASR(): Subject<string> {
    this.changeStatus(ASRProcessStatus.STARTED);
    const subj = new Subject<string>();
    const audioManager = this.parent.audiomanager;
    const timestamp = Date.now();

    // 1) cut signal
    const format = new WavFormat();
    format.init(audioManager.ressource.info.fullname, audioManager.ressource.arraybuffer);

    console.log('CUT AUDIO');
    format.cutAudioFile(audioManager.ressource.info.type, `OCTRA_ASRqueueItem_${this._id}`, audioManager.ressource.arraybuffer,
      {
        number: 1,
        sampleStart: this.time.sampleStart,
        sampleDur: this.time.sampleLength
      }).then((file) => {
      // 2) upload signal
      console.log('UPLOAD AUDIO');
      this.uploadFile(file, this.selectedLanguage).then((url: string) => {
        // 3) signal audio url to ASR
        console.log('callASR ' + this.selectedLanguage.asr + ' - ' + this.selectedLanguage.code);
        this.callASR(this.selectedLanguage, url, timestamp).then((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            this._result = reader.result as string;
            this.changeStatus(ASRProcessStatus.FINISHED);
            subj.complete();
          };

          reader.onerror = (error: any) => {
            this._result = 'Could not read result';
            this.changeStatus(ASRProcessStatus.FAILED);
            subj.error(error);
          };

          reader.readAsText(file, 'utf-8');
        }).catch((error) => {
          subj.error(error);
          this._result = error;
          this.changeStatus(ASRProcessStatus.FAILED);
        });
      }).catch((error) => {
        subj.error(error);
        this._result = error;
        this.changeStatus(ASRProcessStatus.FAILED);
      });
    }).catch((error) => {
      subj.error(error);
      this._result = error;
      this.changeStatus(ASRProcessStatus.FAILED);
    });

    return subj;
  }
}

export enum ASRProcessStatus {
  IDLE = 'IDLE',
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
  FAILED = 'FAILED',
  FINISHED = 'FINISHED'
}
