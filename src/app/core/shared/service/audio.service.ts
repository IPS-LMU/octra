import {EventEmitter, Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {HttpClient} from '@angular/common/http';
import {Functions, isNullOrUndefined} from '../Functions';
import {AppInfo} from '../../../app.info';
import {AudioManager} from '../../../media-components/obj/audio/AudioManager';

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

  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  private afterloaded: EventEmitter<any> = new EventEmitter<any>();
  private _audiomanagers: AudioManager[] = [];
  private _loaded = false;

  /**
   * loadAudio(url) loads the audio data referred to via the URL in an AJAX call.
   * The audiodata is written to the local audiobuffer field.
   *
   * audio data; for longer data, a MediaElementAudioSourceNode should be used.
   */
  public loadAudio: (url: string, callback: () => void) => Subject<any>
    = (url: string, callback: any = () => {
  }) => {
    this._loaded = false;

    const subj = new Subject<number>();

    Functions.downloadFile(this.http, url).subscribe(
      (event) => {
        subj.next(0.5 * event.progress);
        if (event.progress === 1 && event.result) {
          const regex: RegExp = new RegExp(/((%|-|\.|[A-ZÄÖÜß]|[a-zäöü]|_|[0-9])+)\.(wav|ogg)/, 'g');
          const matches: RegExpExecArray = regex.exec(url);

          let filename = '';
          if (matches !== null && matches[1].length > 0) {
            filename = matches[1] + '.' + matches[3];
          } else {
            filename = url;
          }

          this.subscrmanager.add(AudioManager.decodeAudio(filename, 'audio/wav', event.result, AppInfo.audioformats).subscribe(
            (result) => {
              if (!isNullOrUndefined(result.audioManager)) {
                subj.next(1);
                subj.complete();
                // finished
                this.registerAudioManager(result.audioManager);
                this.afterloaded.emit({status: 'success'});

                callback({});
              } else {
                subj.next(0.5 + 0.5 * result.decodeProgress);
              }
            },
            (error) => {
              subj.error(error);
            }));
        }
      },
      error => {
        subj.error(error);
      }
    );

    return subj;
  }

  public registerAudioManager(manager: AudioManager) {
    console.log(`register new audio manager`);
    const found = this._audiomanagers.find((a: AudioManager) => {
      return a.ressource.name === manager.ressource.name;
    });

    if ((found === null || found === undefined)) {
      this._audiomanagers.push(manager);
    }
  }

  public destroy(disconnect: boolean = true) {
    console.log(`destroy all!`);
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
