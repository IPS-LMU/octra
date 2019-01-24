import {EventEmitter, Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AppInfo} from '../../../app.info';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class AudioService {

  get audiomanagers(): AudioManager[] {
    return this._audiomanagers;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  /***
   * Constructor
   */
  constructor(private http: HttpClient) {
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

    const request = this.http.get(url, {responseType: 'arraybuffer'}).subscribe(
      (buffer: ArrayBuffer) => {
        const regex: RegExp = new RegExp(/((%|-|\.|[A-ZÄÖÜß]|[a-zäöü]|_|[0-9])+)\.(wav|ogg)/, 'g');
        const matches: RegExpExecArray = regex.exec(url);

        let filename = '';
        if (matches !== null && matches[1].length > 0) {
          filename = matches[1] + '.' + matches[3];
        } else {
          filename = url;
        }

        AudioManager.decodeAudio(filename, 'audio/wav', buffer, AppInfo.audioformats).then(
          (manager: AudioManager) => {
            this.registerAudioManager(manager);

            console.log('Audio (Length: ' + manager.ressource.size + ') loaded. Decode now...');
            this.afterloaded.emit({status: 'success'});
            callback({});
          }
        ).catch((err) => {
          errorcallback(err);
        });
      },
      error => {
        errorcallback(error);
      }
    );
  }
  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  private afterloaded: EventEmitter<any> = new EventEmitter<any>();
  private _audiomanagers: AudioManager[] = [];
  private _loaded = false;

  public registerAudioManager(manager: AudioManager) {
    const found = this._audiomanagers.find((a: AudioManager) => {
      return a.ressource.name === manager.ressource.name;
    });

    if ((found === null || found === undefined)) {
      this._audiomanagers.push(manager);
    }
  }

  public destroy(disconnect: boolean = true) {
    for (let i = 0; i < this._audiomanagers.length; i++) {
      this._audiomanagers[i].destroy(disconnect);
    }
    this._audiomanagers = [];
  }

  private handleError(err: any) {
    const errMsg = err;
    console.error(errMsg); // log to console instead
    return Observable.throw(errMsg);
  }
}
