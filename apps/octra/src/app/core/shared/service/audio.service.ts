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
  private _loadingRequests = new Map<string, Subject<any>>();

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
    // guard against duplicate downloads of the same audio file being triggered
    // in parallel (e.g. by racing effects on app startup)
    const runningRequest = this._loadingRequests.get(url);
    if (runningRequest) {
      return runningRequest;
    }

    this._loaded = false;

    const subj = new Subject<number>();
    this._loadingRequests.set(url, subj);

    // bypass the Angular Service Worker for this download: it's a large,
    // long-running binary transfer that isn't part of any asset/data group,
    // and letting the SW intercept it exposes it to unrelated SW-internal
    // state transitions (e.g. an app-version check completing mid-download),
    // which can abort the request with an opaque "ServiceWorker intercepted
    // the request" error - see ngsw-bypass usage in asr.effects.service.ts
    downloadFile<ArrayBuffer>(this.http, url, 'arraybuffer', {
      'ngsw-bypass': 'true',
    }).subscribe({
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

                  this._loadingRequests.delete(url);
                  subj.next(result.progress);
                  subj.complete();
                } else {
                  subj.next(result.progress);
                }
              },
              error: (error: any) => {
                this._loadingRequests.delete(url);
                subj.error(error);
              },
            }),
          );
        }
      },
      error: (error) => {
        this._loadingRequests.delete(url);
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
    this._loadingRequests.clear();
    this.subscrmanager.destroy();
  }
}
