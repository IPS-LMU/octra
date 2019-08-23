import {Injectable} from '@angular/core';
import {ASRLanguage, ASRSettings} from '../../obj/Settings';
import {SettingsService} from './settings.service';
import {AppStorageService} from './appstorage.service';
import {isNullOrUndefined} from '../Functions';
import {HttpClient} from '@angular/common/http';
import {FileInfo} from '../../../media-components/obj/fileInfo';
import * as X2JS from 'x2js';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AudioService} from './audio.service';
import {WavFormat} from '../../../media-components/obj/media/audio/AudioFormats';
import {Subject} from 'rxjs';
import {AudioChunk} from '../../../media-components/obj/media/audio/AudioManager';

@Injectable({
  providedIn: 'root'
})
export class AsrService {
  get selectedLanguage(): ASRLanguage {
    return this._selectedLanguage;
  }

  set selectedLanguage(value: ASRLanguage) {
    this._selectedLanguage = value;
    this.appStorage.asrSelectedLanguage = value.code;
    this.appStorage.asrSelectedService = value.asr;
  }

  private _selectedLanguage: ASRLanguage = null;
  private _subscrManager = new SubscriptionManager();

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
      const asrUrl = this.asrSettings.calls[0].replace('{{host}}', languageObject.host)
        .replace('{{audioURL}}', audioURL)
        .replace('{{asrType}}', languageObject.asr)
        .replace('{{language}}', languageObject.code);

      console.log(`Call ${languageObject.asr}ASR:`);
      console.log(audioURL);
      this.httpClient.post(asrUrl, {}, {
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
            const file = FileInfo.fromURL(json.downloadLink, `segment_${timestamp}.txt`, 'text/plain');
            file.updateContentFromURL(this.httpClient).then(() => {
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

  public transcribeSignalWithASR(audioChunk: AudioChunk): Subject<string> {
    const subj = new Subject<string>();
    const audioManager = this.audioService.audiomanagers[0];

    if (!isNullOrUndefined(audioChunk)) {
      const timestamp = Date.now();

      // 1) cut signal
      const format = new WavFormat();
      format.init(audioManager.ressource.info.fullname, audioManager.ressource.arraybuffer);

      console.log('CUT AUDIO');
      format.cutAudioFile(audioManager.ressource.info.type, `segment_${timestamp}`, audioManager.ressource.arraybuffer,
        {
          number: 1,
          sampleStart: audioChunk.time.start.originalSample.value,
          sampleDur: audioChunk.time.duration.originalSample.value
        }).then((file) => {
        // 2) upload signal
        console.log('UPLOAD AUDIO');
        this.uploadFile(file, this.selectedLanguage).then((url: string) => {
          // 3) signal audio url to ASR
          console.log('callASR ' + this.selectedLanguage.asr + ' - ' + this.selectedLanguage.code);
          this.callASR(this.selectedLanguage, url, timestamp).then((file) => {
            const reader = new FileReader();
            reader.onload = () => {
              subj.next(reader.result as string);
              this.resultRetrieved.next({
                sampleStart: audioChunk.time.start.originalSample.value,
                sampleLength: audioChunk.time.duration.originalSample.value,
                text: reader.result as string
              });
              subj.complete();
            };

            reader.onerror = (error: any) => {
              subj.error(error);
            };

            reader.readAsText(file, 'utf-8');
          }).catch((error) => {
            subj.error(error);
          });
        }).catch((error) => {
          subj.error(error);
        });
      }).catch((error) => {
        subj.error(error);
      });
    } else {
      console.error('Audiochunk is empty!');
    }

    return subj;
  }
}
