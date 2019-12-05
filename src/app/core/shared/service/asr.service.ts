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
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {TranscriptionService} from './transcription.service';
import {BrowserSample, OriginalSample} from '../../../media-components/obj/media/audio';
import {Router} from '@angular/router';

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
    if (!isNullOrUndefined(value)) {
      this.appStorage.asrSelectedLanguage = value.code;
      this.appStorage.asrSelectedService = value.asr;
    } else {
      this.appStorage.asrSelectedLanguage = null;
      this.appStorage.asrSelectedService = null;
    }
  }

  public static authURL = '';
  private _selectedLanguage: ASRLanguage = null;
  private _queue: ASRQueue;

  public get asrSettings(): ASRSettings {
    return this.settingsService.appSettings.octra.plugins.asr;
  }

  constructor(private settingsService: SettingsService, private appStorage: AppStorageService, private httpClient: HttpClient,
              private audioService: AudioService, private transcrService: TranscriptionService, private router: Router) {
  }

  public init() {
    this._queue = new ASRQueue(this.asrSettings, this.audioService.audiomanagers[0], this.httpClient);
    if (!isNullOrUndefined(this.appStorage.asrSelectedLanguage) && !isNullOrUndefined(this.appStorage.asrSelectedService)) {
      this._selectedLanguage = this.getLanguageByCode(this.appStorage.asrSelectedLanguage, this.appStorage.asrSelectedService);
    }
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
    if (!isNullOrUndefined(this.appStorage.shibbolethOK) && this.appStorage.shibbolethOK) {
      this._queue.start();
    } else {
      // redirect via location href is important because it's not working otherwise!
      document.location.href = 'user/auth/';
    }
  }

  public addToQueue(timeInterval: { sampleStart: number, sampleLength: number, browserSampleEnd: number }, type: ASRQueueItemType): ASRQueueItem {
    const item = new ASRQueueItem({
      sampleStart: timeInterval.sampleStart,
      sampleLength: timeInterval.sampleLength,
      browserSampleEnd: timeInterval.browserSampleEnd
    }, this.queue, this.selectedLanguage, type);
    this.queue.add(item);
    return item;
  }

  public stopASR() {
    // change status to STOPPED
    this._queue.stop();

    for (let i = 0; i < this._queue.queue.length; i++) {
      const item = this._queue.queue[i];
      this.stopASROfItem(item);
    }
  }

  public stopASROfItem(item: ASRQueueItem) {
    if (item !== undefined && item !== null) {
      const audioManager = this.audioService.audiomanagers[0];
      const segmentBoundary = BrowserSample.fromOriginalSample(
        new OriginalSample(item.time.sampleStart + item.time.sampleLength, audioManager.originalSampleRate),
        audioManager.browserSampleRate);
      const segNumber = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
        segmentBoundary
      );

      if (segNumber > -1) {
        this.transcrService.currentlevel.segments.get(segNumber).isBlockedBy = null;
        item.stopProcessing();
      } else {
        console.error(new Error(`could not find segment.`));
      }
    } else {
      console.error(new Error('item is undefined!'));
    }
  }
}

class ASRQueue {
  get queue(): ASRQueueItem[] {
    return this._queue;
  }

  get itemChange(): Subject<ASRQueueItem> {
    return this._itemChange;
  }

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

  private _queue: ASRQueueItem[];
  private readonly _asrSettings: ASRSettings;
  private readonly _httpClient: HttpClient;
  private _status: ASRProcessStatus;
  private readonly _audiomanager: AudioManager;

  private readonly _itemChange: Subject<ASRQueueItem>;

  private _statistics = {
    running: 0,
    stopped: 0,
    failed: 0,
    finished: 0
  };

  private readonly MAX_PARALLEL_ITEMS = 3;

  public get length(): number {
    return this._queue.length;
  }

  constructor(asrSettings: ASRSettings, audioManager: AudioManager, httpClient: HttpClient) {
    this._asrSettings = asrSettings;
    this._httpClient = httpClient;
    this._queue = [];
    this._status = ASRProcessStatus.IDLE;
    this._audiomanager = audioManager;

    this._itemChange = new Subject<ASRQueueItem>();
  }

  public add(queueItem: ASRQueueItem) {
    const found = this._queue.find((a) => {
      return a.id === queueItem.id;
    }) !== undefined;

    if (!found) {
      this._queue.push(queueItem);
    } else {
      console.error(Error('QueueItem with id ' + queueItem.id + ' already added!'));
    }
  }

  public remove(id: number) {
    const index = this._queue.findIndex((a) => {
      return a.id === id;
    });

    if (index > -1) {
      this._queue.splice(index, 1);
    } else {
      console.error(`could not remove queueItem with id ${id}`);
    }
  }

  public clear() {
    this._queue = [];
    this.clearStatistics();
    this._itemChange.complete();
  }

  public start() {
    this._status = ASRProcessStatus.STARTED;
    this.startNext();
  }

  private startNext() {
    if (this.status === ASRProcessStatus.STARTED) {
      if (this._statistics.running < this.MAX_PARALLEL_ITEMS) {
        const nextItem = this.getFirstFreeItem();

        if (nextItem !== undefined) {
          if (nextItem.startProcessing()) {
            this.updateStatistics({
              old: ASRProcessStatus.IDLE,
              new: ASRProcessStatus.STARTED
            });
            this._itemChange.next(nextItem);
            nextItem.statusChange.subscribe((status) => {

                if (status.new !== ASRProcessStatus.STARTED) {
                  this.remove(nextItem.id);
                }
                this.updateStatistics(status);
                this._itemChange.next(nextItem);

                setTimeout(() => {
                  this.startNext();
                }, 1000);
              },
              (error) => {
                console.error(error);
                setTimeout(() => {
                  this.startNext();
                }, 1000);
              },
              () => {
                setTimeout(() => {
                  this.startNext();
                }, 1000);
              });
          } else {
            nextItem.changeStatus(ASRProcessStatus.FAILED);
          }

          setTimeout(() => {
            this.startNext();
          }, 1000);
        } else {
          // no free items left, check if something running
          if (this._queue.find((a) => {
            return a.status === ASRProcessStatus.STARTED;
          }) === undefined) {
            this._status = ASRProcessStatus.IDLE;
          }
        }
      }
    }
  }

  private getFirstFreeItem(): ASRQueueItem | undefined {
    return this._queue.find((a) => {
      return a.status === ASRProcessStatus.IDLE;
    });
  }

  public getItemByTime(sampleStart: number, sampleLength: number): ASRQueueItem | undefined {
    return this._queue.find((a) => {
      return a.time.sampleStart === sampleStart && a.time.sampleLength === sampleLength;
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

  private clearStatistics() {
    this._statistics = {
      failed: 0,
      finished: 0,
      stopped: 0,
      running: 0
    };
  }

  public stop() {
    this._status = ASRProcessStatus.STOPPED;
  }

  public destroy() {
    this._itemChange.complete();
  }
}

export class ASRQueueItem {
  get type(): ASRQueueItemType {
    return this._type;
  }

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

  get time(): { sampleStart: number; sampleLength: number; browserSampleEnd: number } {
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
    browserSampleEnd: number;
  };
  private _status: ASRProcessStatus;
  private readonly _statusChange: Subject<{
    old: ASRProcessStatus,
    new: ASRProcessStatus
  }>;
  private parent: ASRQueue;
  private readonly _selectedLanguage: ASRLanguage;
  private _result: string;
  private readonly _type: ASRQueueItemType;

  constructor(timeInterval: {
    sampleStart: number,
    sampleLength: number,
    browserSampleEnd: number
  }, asrQueue: ASRQueue, selectedLanguage: ASRLanguage, type: ASRQueueItemType) {
    this._id = ASRQueueItem.counter++;
    this._time = {
      sampleStart: timeInterval.sampleStart,
      sampleLength: timeInterval.sampleLength,
      browserSampleEnd: timeInterval.browserSampleEnd
    };
    this._status = ASRProcessStatus.IDLE;
    this._statusChange = new Subject<{
      old: ASRProcessStatus,
      new: ASRProcessStatus
    }>();
    this.parent = asrQueue;
    this._selectedLanguage = selectedLanguage;
    this._type = type;
  }

  public changeStatus(newStatus: ASRProcessStatus) {
    if (this._status !== newStatus) {
      const old = this._status;
      this._status = newStatus;
      this._statusChange.next({
        old,
        new: this._status
      });
    }
  }

  public startProcessing(): boolean {
    if (this.status !== ASRProcessStatus.STARTED) {
      if (this._type === ASRQueueItemType.ASR) {
        console.log(`CALL ASR ONLY`);
        this.transcribeSignalWithASR('txt').then(() => {
          this.changeStatus(ASRProcessStatus.FINISHED);
        });
      } else {
        console.log(`CALL ASR MAUS`);
        // call ASR and than MAUS
        this.transcribeSignalWithASR('bpf').then((result) => {
          console.log(result);

          this.callMAUS(this._selectedLanguage, result.audioURL, result.transcriptURL).then((result) => {
            const reader = new FileReader();

            reader.readAsText(result.file, 'utf-8');
            reader.onerror = (error) => {
              console.error(error);
              this.changeStatus(ASRProcessStatus.FAILED);
            };

            reader.onload = () => {
              this._result = reader.result as string;
              this.changeStatus(ASRProcessStatus.FINISHED);
            };
          }).catch((error) => {
            console.error(error);
            this.changeStatus(ASRProcessStatus.FAILED);
          });
        });
      }
      return true;
    }
    return false;
  }

  public stopProcessing(): boolean {
    this.changeStatus(ASRProcessStatus.STOPPED);
    this.statusChange.complete();
    return true;
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
        const x2js = new X2JS();
        let json: any = x2js.xml2js(result);
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

  private callASR(languageObject: ASRLanguage, audioURL: string, outFormat: string): Promise<{
    file: File,
    url: string
  }> {
    return new Promise<{
      file: File,
      url: string
    }>((resolve, reject) => {
      const asrUrl = this.parent.asrSettings.calls[0].replace('{{host}}', languageObject.host)
        .replace('{{audioURL}}', audioURL)
        .replace('{{asrType}}', languageObject.asr)
        .replace('{{language}}', languageObject.code)
        .replace('{{outFormat}}', outFormat);

      this.parent.httpClient.post(asrUrl, {}, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'text'
      }).subscribe((result: string) => {
          // convert result to json
          const x2js = new X2JS();
          let json: any = x2js.xml2js(result);
          json = json.WebServiceResponseLink;

          if (json.success === 'true') {
            const file = FileInfo.fromURL(json.downloadLink, `OCTRA_ASRqueueItem_${this._id}.txt`, 'text/plain');
            file.updateContentFromURL(this.parent.httpClient).then(() => {
              // add messages to protocol
              resolve({
                file: file.file,
                url: json.downloadLink
              });
            }).catch((error) => {
              reject(error);
            });
          } else {
            reject(json.output);
          }
        },
        (error) => {
          console.log(error.message);
          if (error.message.indexOf('0 Unknown Error') > -1) {
            // do redirect
            this.changeStatus(ASRProcessStatus.NOAUTH);
            // redirect via location href is important because it's not working otherwise!
            document.location.href = 'user/auth/';
          }
          reject(error.message);
        });
    });
  }

  private callMAUS(languageObject: ASRLanguage, audioURL: string, transcriptURL: string): Promise<{
    file: File,
    url: string
  }> {
    return new Promise<{
      file: File,
      url: string
    }>((resolve, reject) => {
      const mausURL = this.parent.asrSettings.calls[1].replace('{{host}}', languageObject.host)
        .replace('{{audioURL}}', audioURL)
        .replace('{{transcriptURL}}', transcriptURL)
        .replace('{{asrType}}', languageObject.asr)
        .replace('{{language}}', languageObject.code);

      this.parent.httpClient.post(mausURL, {}, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'text'
      }).subscribe((result: string) => {
          // convert result to json
          const x2js = new X2JS();
          let json: any = x2js.xml2js(result);
          json = json.WebServiceResponseLink;

          if (json.success === 'true') {
            const file = FileInfo.fromURL(json.downloadLink, `OCTRA_ASRqueueItem_${this._id}.txt`, 'text/plain');
            file.updateContentFromURL(this.parent.httpClient).then(() => {
              // add messages to protocol
              resolve({
                file: file.file,
                url: json.downloadLink
              });
            }).catch((error) => {
              reject(error);
            });
          } else {
            reject(json.output);
          }
        },
        (error) => {
          console.log(error.message);
          if (error.message.indexOf('0 Unknown Error') > -1) {
            // do redirect
            AsrService.authURL = mausURL;
            this.changeStatus(ASRProcessStatus.NOAUTH);
          }
          reject(error.message);
        });
    });
  }

  public transcribeSignalWithASR(outFormat: string): Promise<{
    audioURL: string,
    transcriptURL: string
  }> {
    return new Promise<{
      audioURL: string,
      transcriptURL: string
    }>((resolve, reject) => {
      this.changeStatus(ASRProcessStatus.STARTED);
      const audioManager = this.parent.audiomanager;

      // 1) cut signal
      const format = new WavFormat();
      format.init(audioManager.ressource.info.fullname, audioManager.ressource.arraybuffer);
      format.cutAudioFile(audioManager.ressource.info.type, `OCTRA_ASRqueueItem_${this._id}`, audioManager.ressource.arraybuffer,
        {
          number: 1,
          sampleStart: this.time.sampleStart,
          sampleDur: this.time.sampleLength
        }).then((file) => {
        if (this._status !== ASRProcessStatus.STOPPED) {
          // 2) upload signal
          this.uploadFile(file, this.selectedLanguage).then((audioURL: string) => {
            if (this._status !== ASRProcessStatus.STOPPED) {
              // 3) signal audio url to ASR
              this.callASR(this.selectedLanguage, audioURL, outFormat).then((asrResult) => {
                if (this._status !== ASRProcessStatus.STOPPED) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    this._result = reader.result as string;

                    // make sure that there are not any white spaces at the end or new lines
                    this._result = this._result.replace(/\n/g, '').trim();

                    resolve({
                      audioURL,
                      transcriptURL: asrResult.url
                    })
                  };

                  reader.onerror = (error: any) => {
                    this._result = 'Could not read result';
                    this.changeStatus(ASRProcessStatus.FAILED);
                    reject(error);
                  };

                  reader.readAsText(asrResult.file, 'utf-8');
                }
              }).catch((error) => {
                this._result = error;
                if (error.indexOf('quota') > -1) {
                  this.changeStatus(ASRProcessStatus.NOQUOTA);
                } else if (error.indexOf('0 Unknown Error')) {
                  this.changeStatus(ASRProcessStatus.NOAUTH);
                } else {
                  this.changeStatus(ASRProcessStatus.FAILED);
                }
                reject(error);
              });
            }
          }).catch((error) => {
            this._result = error;
            this.changeStatus(ASRProcessStatus.FAILED);
            reject(error);
          });
        }
      }).catch((error) => {
        this._result = error;
        this.changeStatus(ASRProcessStatus.FAILED);
        reject(error);
      });
    });
  }
}

export enum ASRQueueItemType {
  ASR = 'ASR',
  ASRMAUS = 'ASRMAUS'
}

export enum ASRProcessStatus {
  IDLE = 'IDLE',
  STARTED = 'STARTED',
  STOPPED = 'STOPPED',
  NOQUOTA = 'NOQUOTA',
  NOAUTH = 'NOAUTH',
  FAILED = 'FAILED',
  FINISHED = 'FINISHED'
}
