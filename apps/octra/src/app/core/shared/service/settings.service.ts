import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {Params} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {Functions, isUnset, SubscriptionManager} from '@octra/utilities';
import {Subject} from 'rxjs';

import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {APIService} from './api.service';
import {AppStorageService} from './appstorage.service';
import {AudioService} from './audio.service';
import {LoginMode} from '../../store';
import {Store} from '@ngrx/store';
import * as fromTranscription from '../../store/transcription';
import * as fromApplication from '../../store/application';
import {ConfigurationActions} from '../../store/configuration/configuration.actions';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public audioloaded: EventEmitter<any> = new EventEmitter<any>();
  public audioloading = new Subject<number>();
  private subscrmanager: SubscriptionManager;

  public get isASREnabled(): boolean {
    return (!isUnset(this.appSettings.octra.plugins.asr) &&
      !isUnset(this.appSettings.octra.plugins.asr.enabled)
      && this.appSettings.octra.plugins.asr.enabled === true
      && !isUnset(this.appSettings.octra.plugins.asr.calls)
      && this.appSettings.octra.plugins.asr.calls.length === 2
      && this.appSettings.octra.plugins.asr.calls[0] !== ''
      && this.appSettings.octra.plugins.asr.calls[1] !== ''
    );
  }

  get responsive(): {
    enabled: boolean,
    fixedwidth: number
  } {
    if (!isUnset(this.projectsettings)
      && !isUnset(this.projectsettings.responsive)) {
      return this.projectsettings.responsive;
    } else {
      return (!isUnset(this.appSettings?.octra.responsive)) ? this.appSettings?.octra.responsive : {
        enabled: true,
        fixedwidth: 1079
      };
    }
  }

  public get isAllLoaded(): boolean {
    return (
      !(this.projectsettings === null || this.projectsettings === undefined)
    );
  }

  get projectsettings(): ProjectSettings {
    return this.appStorage.snapshot.transcription.projectConfig;
  }

  get appSettings(): AppSettings {
    return this.appStorage.snapshot.application.appConfiguration;
  }

  get guidelines(): any {
    return this.appStorage.snapshot.transcription.guidelines;
  }

  private _loaded = false;

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(value: boolean) {
    this._loaded = value;
  }

  private _log = '';

  get log(): string {
    return this._log;
  }

  set log(value: string) {
    this._log = value;
  }

  private _filename: string;

  get filename(): string {
    return this._filename;
  }

  get validationmethod(): (str: string, obj: any) => any[] {
    return this.appStorage.snapshot.transcription.methods.validate;
  }

  get tidyUpMethod(): (str: string, obj: any) => string {
    return this.appStorage.snapshot.transcription.methods.tidyUp;
  }

  private _isDBLoadded = false;

  get isDBLoadded(): boolean {
    return this._isDBLoadded;
  }

  constructor(private http: HttpClient,
              private appStorage: AppStorageService,
              private api: APIService,
              private langService: TranslocoService,
              private store: Store) {
    this.subscrmanager = new SubscriptionManager();
  }

  public static queryParamsSet(queryParams: Params): boolean {
    return (
      !isUnset(queryParams.audio) &&
      !isUnset(queryParams.embedded)
    );
  }

  public loadDB = (queryParams: Params) => {
    // check for Updates
    if (SettingsService.queryParamsSet(queryParams)) {
      // URL MODE, overwrite db name with 'url'
      console.log('appRoute has params');
      this.appSettings.octra.database.name = 'octra_url';
    } else {
      console.log('appRoute has no params');
    }


    const transcriptURL = (queryParams.transcript !== undefined)
      ? queryParams.transcript : null;

    Functions.afterTrue(this.store.select(fromApplication.selectIDBLoaded)).then(() => {
      console.log(`selectIDBLoaded is true!`);
      // define languages
      const languages = this.appSettings.octra.languages;
      // @ts-ignore
      const browserLang = navigator.language || navigator.userLanguage;

      // check if browser language is available in translations
      if (isUnset(this.appStorage.language) || this.appStorage.language === '') {
        if ((this.appSettings.octra.languages.find((value) => {
          return value === browserLang;
        })) !== undefined) {
          this.langService.setActiveLang(browserLang);
        } else {
          // use first language defined as default language
          this.langService.setActiveLang(languages[0]);
        }
      } else {
        if ((this.appSettings.octra.languages.find((value) => {
          return value === this.appStorage.language;
        })) !== undefined) {
          this.langService.setActiveLang(this.appStorage.language);
        } else {
          this.langService.setActiveLang(languages[0]);
        }
      }

      // if url mode, set it in options
      if (SettingsService.queryParamsSet(queryParams)) {
        this.appStorage.setURLSession(queryParams.audio, transcriptURL, (queryParams.embedded === '1'), queryParams.host);
      }

      // settings have been loaded
      if ((this.appSettings === null || this.appSettings === undefined)) {
        throw new Error('config.json does not exist');
      } else {
        this.api.init(this.appSettings.audio_server.url + 'WebTranscribe');
      }
      this._isDBLoadded = true;
    }).catch((error) => {
      console.error(error);
    });
  }

  public loadAudioFile: ((audioService: AudioService) => void) = (audioService: AudioService) => {
    console.log('Load audio file 2...');
    if (isUnset(this.appStorage.useMode)) {
      this._log += `An error occured. Please click on "Back" and try it again.`;
    }
    if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.URL || this.appStorage.useMode === LoginMode.DEMO) {
      // online, url or demo
      if (!(this.appStorage.audioURL === null || this.appStorage.audioURL === undefined)) {
        let src = '';
        if (this.appStorage.useMode === LoginMode.ONLINE) {
          src = this.appSettings.audio_server.url + this.appStorage.audioURL;
        } else {
          src = this.appStorage.audioURL;
        }
        // extract filename
        this._filename = this.appStorage.audioURL.substr(this.appStorage.audioURL.lastIndexOf('/') + 1);
        this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));
        if (this._filename.indexOf('src=') > -1) {
          this._filename = this._filename.substr(this._filename.indexOf('src=') + 4);
        }

        audioService.loadAudio(src).subscribe(
          (progress) => {
            this.audioloading.next(progress);

            if (progress === 1) {
              this.audioloading.complete();
            }
          },
          (err) => {
            this._log = 'Loading audio file failed<br/>';
            console.error(err);
          },
          () => {
            this.audioloaded.emit({status: 'success'});
          }
        );
      } else {
        this._log += `No audio source found. Please click on "Back" and try it again.`;
        console.error('audio src is null');
        this.audioloaded.emit({status: 'error'});
      }
    } else if (this.appStorage.useMode === LoginMode.LOCAL) {
      // local mode
      if (!isUnset(this.appStorage.sessionfile)) {
        this._filename = this.appStorage.sessionfile.name;
        this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));

        console.log('Audio loaded.');
        this.audioloaded.emit({status: 'success'});

      } else {
        console.error('session file is null.');
      }
    }
  }

  public loadApplicationSettings(queryParams: any): Promise<void> {
    this.store.dispatch(ConfigurationActions.loadAppConfiguration());
    return new Promise<void>((resolve, reject) => {
      const subscr = this.store.select(fromApplication.selectAppSettings).subscribe((appConfig) => {
        if (!isUnset(appConfig)) {
          subscr.unsubscribe();
          console.log('AppSettings loaded.');

          // settings finally loaded
          resolve();

          this.loadDB(queryParams);
          this.triggerSettingsLoaded();
        }
      }, (error) => {
        reject(error);
      });
    });
  }

  public destroy() {
    this.subscrmanager.destroy();
  }

  /**
   * checks jif the specific theme is active
   */
  public isTheme(theme: string) {
    const selectedTheme = (
      isUnset(this.projectsettings.octra)
      || isUnset(this.projectsettings.octra.theme)
    )
      ? 'default' : this.projectsettings.octra.theme;

    return (selectedTheme === theme);
  }

  public getAudioExample(language: string) {
    if (!isUnset(this.appSettings.octra.audioExamples)) {
      let example = this.appSettings.octra.audioExamples.find(
        (a) => {
          return a.language === language;
        });

      if (example === undefined) {
        example = this.appSettings.octra.audioExamples[0];
      }

      return example;
    }

    return undefined;
  }


  public loadGuidelines = () => {
    this.store.dispatch(ConfigurationActions.loadGuidelines({
      projectConfig: this.projectsettings
    }));
  }

  private triggerSettingsLoaded = () => {
    this.loaded = true;
  }

  public allLoaded() {
    const promises: Promise<void>[] = [];
    promises.push(Functions.afterTrue(this.store.select(fromApplication.selectIDBLoaded)));
    promises.push(Functions.afterDefined(this.store.select(fromApplication.selectAppSettings)));
    promises.push(Functions.afterDefined(this.store.select(fromTranscription.selectProjectConfig)));
    promises.push(Functions.afterDefined(this.store.select(fromTranscription.selectGuideLines)));
    promises.push(Functions.afterDefined(this.store.select(fromTranscription.selectMethods)));

    return Promise.all(promises);
  }
}
