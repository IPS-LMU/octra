import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { AppInfo } from '../../../app.info';
import { SubscriptionManager } from '@octra/utilities';
import { downloadFile } from '@octra/ngx-utilities';
import { Subject, Subscription } from 'rxjs';
import { TaskInputOutputDto } from '@octra/api-types';
import { AudioManager } from '@octra/web-media';

@Injectable()
export class AudioService {
  public missingPermission = new EventEmitter<void>();
  private subscrmanager: SubscriptionManager<Subscription> =
    new SubscriptionManager<Subscription>();
  private afterloaded: EventEmitter<any> = new EventEmitter<any>();

  private _audiomanagers: AudioManager[] = [];

  get audiomanagers(): AudioManager[] {
    return this._audiomanagers;
  }

  private _loaded = false;

  get loaded(): boolean {
    return this._loaded;
  }

  get audioManager(): AudioManager {
    return this._audiomanagers[0];
  }

  /***
   * Constructor
   */
  constructor(private http: HttpClient) {}

  /**
   * loadAudio(url) loads the audio data referred to via the URL in an AJAX call.
   * The audiodata is written to the local audiobuffer field.
   *
   * audio data; for longer data, a MediaElementAudioSourceNode should be used.
   */
  public loadAudio: (
    url: string,
    audioInput: TaskInputOutputDto
  ) => Subject<any> = (url: string, audioInput: TaskInputOutputDto) => {
    this._loaded = false;

    const subj = new Subject<number>();

    downloadFile(this.http, url).subscribe({
      next: (event) => {
        subj.next(0.5 * event.progress);
        if (event.progress === 1 && event.result) {
          this.subscrmanager.add(
            AudioManager.decodeAudio(
              audioInput.filename,
              audioInput.type,
              event.result,
              AppInfo.audioformats,
              url
            ).subscribe({
              next: (result: any) => {
                if (
                  result.audioManager !== undefined &&
                  result.audioManager !== null
                ) {
                  // finished
                  result.audioManager.resource.info.url = url;
                  this.registerAudioManager(result.audioManager);
                  this.afterloaded.emit({ status: 'success' });

                  subj.next(1);
                  subj.complete();
                } else {
                  subj.next(0.5 + 0.5 * result.decodeProgress);
                }
              },
              error: (error: any) => {
                subj.error(error);
              },
            })
          );
        }
      },
      error: (error) => {
        subj.error(error);
      },
    });

    return subj;
  };

  public registerAudioManager(manager: AudioManager) {
    if (manager !== undefined) {
      const found = this._audiomanagers.find((a: AudioManager) => {
        return a.resource.name === manager.resource.name;
      });

      if (found === undefined) {
        this._audiomanagers.push(manager);

        this.subscrmanager.add(
          manager.missingPermission.subscribe(() => {
            this.missingPermission.emit();
            this.missingPermission.complete();
          })
        );
      }
    }
  }

  public destroy(disconnect: boolean = true) {
    for (const audiomanager of this._audiomanagers) {
      audiomanager.destroy(disconnect);
    }
    this._audiomanagers = [];
    this.subscrmanager.destroy();
  }
}
