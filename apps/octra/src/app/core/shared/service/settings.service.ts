import { HttpClient } from "@angular/common/http";
import { EventEmitter, Injectable } from "@angular/core";
import { Params } from "@angular/router";
import { TranslocoService } from "@ngneat/transloco";
import { afterDefined, afterTrue, SubscriptionManager } from "@octra/utilities";

import { AppSettings, ProjectSettings } from "../../obj/Settings";
import { AppStorageService } from "./appstorage.service";
import { AudioService } from "./audio.service";
import { getModeState, LoginMode } from "../../store";
import { Store } from "@ngrx/store";
import * as fromApplication from "../../store/application";
import { ConfigurationActions } from "../../store/configuration/configuration.actions";
import { Subject, Subscription } from "rxjs";
import { OctraAPIService } from "@octra/ngx-octra-api";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public audioloaded: EventEmitter<any> = new EventEmitter<any>();
  public audioloading = new Subject<number>();
  private subscrmanager: SubscriptionManager<Subscription>;

  public get isASREnabled(): boolean {
    return (this.appSettings.octra.plugins.asr !== undefined &&
      this.appSettings.octra.plugins.asr.enabled !== undefined
      && this.appSettings.octra.plugins.asr.enabled === true
      && this.appSettings.octra.plugins.asr.calls !== undefined
      && this.appSettings.octra.plugins.asr.calls.length === 2
      && this.appSettings.octra.plugins.asr.calls[0] !== ''
      && this.appSettings.octra.plugins.asr.calls[1] !== ''
    );
  }

  get responsive(): {
    enabled: boolean,
    fixedwidth: number
  } {
    if (this.projectsettings !== undefined
      && this.projectsettings.responsive !== undefined) {
      return this.projectsettings.responsive;
    } else {
      return (this.appSettings?.octra.responsive !== undefined) ? this.appSettings?.octra.responsive : {
        enabled: true,
        fixedwidth: 1079
      };
    }
  }

  public get isAllLoaded(): boolean {
    return this.isDBLoadded;
  }

  get projectsettings(): ProjectSettings {
    return getModeState(this.appStorage.snapshot)?.projectConfig;
  }

  get appSettings(): AppSettings {
    return this.appStorage.snapshot.application.appConfiguration;
  }

  get guidelines(): any {
    return getModeState(this.appStorage.snapshot)?.guidelines;
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
    return getModeState(this.appStorage.snapshot).methods.validate;
  }

  get tidyUpMethod(): (str: string, obj: any) => string {
    return getModeState(this.appStorage.snapshot).methods.tidyUp;
  }

  private _isDBLoadded = false;

  get isDBLoadded(): boolean {
    return this._isDBLoadded;
  }

  constructor(private http: HttpClient,
              private appStorage: AppStorageService,
              private api: OctraAPIService,
              private langService: TranslocoService,
              private store: Store) {
    this.subscrmanager = new SubscriptionManager<Subscription>();
  }

  public static queryParamsSet(queryParams: Params): boolean {
    return (
      queryParams.audio !== undefined &&
      queryParams.embedded !== undefined
    );
  }

  public loadDB = (queryParams: Params) => {
    // check for Updates
    if (SettingsService.queryParamsSet(queryParams)) {
      // URL MODE, overwrite db name with 'url'
      console.log('appRoute has params');

      // TODO ngstore: change this
      // this.appSettings.octra.database.name = "";
    } else {
      console.log('appRoute has no params');
    }

    return afterTrue(this.store.select(fromApplication.selectIDBLoaded));
  }

  public loadAudioFile: ((audioService: AudioService) => void) = (audioService: AudioService) => {
    console.log('Load audio file 2...');
    if (this.appStorage.useMode === undefined) {
      this._log += `An error occured. Please click on "Back" and try it again.`;
    }
    if (this.appStorage.useMode === LoginMode.ONLINE || this.appStorage.useMode === LoginMode.URL || this.appStorage.useMode === LoginMode.DEMO) {
      // online, url or demo
      if (!(this.appStorage.audioURL === undefined)) {
        const src = this.appStorage.audioURL;
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
        console.error('audio src is undefined');
        this.audioloaded.emit({status: 'error'});
      }
    } else if (this.appStorage.useMode === LoginMode.LOCAL) {
      // local mode
      if (this.appStorage.sessionfile !== undefined) {
        this._filename = this.appStorage.sessionfile.name;
        this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));

        console.log('Audio loaded.');
        this.audioloaded.emit({status: 'success'});

      } else {
        console.error('session file is undefined.');
      }
    }
  }

  public loadApplicationSettings(queryParams: any): Promise<void> {
    console.log(`load app settings`);

    return new Promise<void>((resolve, reject) => {
      // TODO remove this this.store.dispatch(ConfigurationActions.loadAppConfiguration());

      afterDefined(this.store.select(fromApplication.selectApplication)).then(() => {
        console.log('AppSettings loaded.');

        this.loadDB(queryParams).then(() => {
          console.log(`then!`);
          const transcriptURL = (queryParams.transcript !== undefined)
            ? queryParams.transcript : undefined;
          // define languages
          const languages = this.appSettings.octra.languages;
          const browserLang = navigator.language || (navigator as any).userLanguage;

          // check if browser language is available in translations
          if (this.appStorage.language === undefined || this.appStorage.language === '') {
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
          if ((this.appSettings === undefined)) {
            throw new Error('config.json does not exist');
          } else {
            console.log(`init octra api`);
            // TODO this.api.init(this.appSettings.api.url, this.appSettings.api.appToken);
            this.api.webToken = this.appStorage?.onlineSession?.loginData?.webToken;
          }
          this._isDBLoadded = true;

          this.triggerSettingsLoaded();
          // settings finally loaded
          console.log(`resolve!`);
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }).catch((error) => {
        console.error(error);
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
      this.projectsettings?.octra === undefined
      || this.projectsettings?.octra?.theme === undefined
    )
      ? 'default' : this.projectsettings?.octra.theme;

    return (selectedTheme === theme);
  }

  public getAudioExample(language: string) {
    if (this.appSettings.octra.audioExamples !== undefined) {
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
    promises.push(afterTrue(this.store.select(fromApplication.selectIDBLoaded)));
    promises.push(afterDefined(this.store.select(fromApplication.selectAppSettings)));

    return Promise.all(promises);
  }
}
