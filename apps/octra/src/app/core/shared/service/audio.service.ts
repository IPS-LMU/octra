import { HttpClient } from '@angular/common/http';
import { EventEmitter, inject, Injectable } from '@angular/core';
import { TaskInputOutputDto } from '@octra/api-types';
import { downloadFile } from '@octra/ngx-utilities';
import { SubscriptionManager } from '@octra/utilities';
import { AudioManager } from '@octra/web-media';
import { Subject, Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private http = inject(HttpClient);

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

  /**
   * loadAudio(url) loads the audio data referred to via the URL in an AJAX call.
   * The audiodata is written to the local audiobuffer field.
   *
   * audio data; for longer data, a MediaElementAudioSourceNode should be used.
   */
  public loadAudio: (
    url: string,
    audioInput: TaskInputOutputDto,
  ) => Subject<any> = (url: string, audioInput: TaskInputOutputDto) => {
    this._loaded = false;

    const subj = new Subject<number>();

    downloadFile<ArrayBuffer>(this.http, url, 'arraybuffer').subscribe({
      next: (event) => {
        subj.next(0.5 * event.progress);
        if (event.progress === 1 && event.result) {
          this.subscrmanager.add(
            AudioManager.create(
              audioInput.filename,
              audioInput.type,
              event.result,
              url,
            ).subscribe({
              next: (result) => {
                if (result.audioManager && result.progress === 1) {
                  // finished
                  result.audioManager.resource.info.url = url;
                  this.registerAudioManager(result.audioManager);
                  this.afterloaded.emit({ status: 'success' });

                  subj.next(result.progress);
                  subj.complete();
                } else {
                  subj.next(result.progress);
                }
              },
              error: (error: any) => {
                subj.error(error);
              },
            }),
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
          manager.audioMechanism!.missingPermission.subscribe(() => {
            this.missingPermission.emit();
            this.missingPermission.complete();
          }),
        );
      }
    }
  }

  public async destroy(disconnect = true) {
    for (const audioManager of this._audiomanagers) {
      await audioManager.destroy(disconnect);
    }
    this._audiomanagers = [];
    this.subscrmanager.destroy();
  }
}
