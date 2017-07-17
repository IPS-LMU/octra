import {EventEmitter, Injectable} from '@angular/core';
import {Http, RequestOptions, Response, ResponseContentType} from '@angular/http';
import {Observable} from 'rxjs/Rx';

import {isNullOrUndefined} from 'util';
import {Logger} from '../Logger';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AudioRessource} from '../../obj/media/audio/AudioRessource';

@Injectable()
export class AudioService {
  get audiomanagers(): AudioManager[] {
    return this._audiomanagers;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  private _audiomanagers: AudioManager[] = [];

  private afterloaded: EventEmitter<any> = new EventEmitter<any>();
  private _loaded = false;

  /***
   * Constructor
   */
  constructor(private http: Http) {
  }

  public registerAudioManager(manager: AudioManager) {
    if (isNullOrUndefined(this._audiomanagers.find((a: AudioManager) => {
        return a.ressource.name === manager.ressource.name;
      }))) {
      this._audiomanagers.push(manager);
    }
  }

  /**
   * loadAudio(url) loads the audio data referred to via the URL in an AJAX call.
   * The audiodata is written to the local audiobuffer field.
   *
   * audio data; for longer data, a MediaElementAudioSourceNode should be used.
   */
  public loadAudio = (url: string, callback: any = () => {
  }, errorcallback: (err: any) => void = () => {
  }) => {
    this._loaded = false;

    const options = new RequestOptions({
      responseType: ResponseContentType.ArrayBuffer
    });

    const request = this.http.get(url, options).subscribe(
      (result) => {
        const buffer = this.extractData(result);
        AudioManager.decodeAudio('test.wav', buffer).then(
          (manager: AudioManager) => {
            this.registerAudioManager(manager);

            Logger.info('Audio (Length: ' + manager.ressource.size + ') loaded. Decode now...');
            console.log('audiomanager finished decoding');
            this.afterloaded.emit({status: 'success'});
            console.log(manager);
            callback({});
          }
        );
      },
      error => {
        errorcallback(error);
      }
    );
  };

  private extractData(result: Response) {
    const data = result.arrayBuffer();
    return data;
  }

  private handleError(err: any) {
    const errMsg = err;
    console.error(errMsg); // log to console instead
    return Observable.throw(errMsg);
  }

  public destroy(disconnect: boolean = true) {

    for (let i = 0; i < this._audiomanagers.length; i++) {
      this._audiomanagers[i].destroy(disconnect);
    }
    this._audiomanagers = [];
  }
}
