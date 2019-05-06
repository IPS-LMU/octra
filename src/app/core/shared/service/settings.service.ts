import {EventEmitter, Injectable} from '@angular/core';

import {SubscriptionManager} from '../';
import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {Subscription} from 'rxjs/Subscription';
import {Functions, isNullOrUndefined} from '../Functions';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {HttpClient} from '@angular/common/http';
import {APIService} from './api.service';
import {TranslateService} from '@ngx-translate/core';
import {UpdateManager} from '../UpdateManager';
import {ActivatedRoute} from '@angular/router';
import {AppStorageService} from './appstorage.service';
import {AudioService} from './audio.service';

declare var validateAnnotation: ((string, any) => any);

@Injectable()
export class SettingsService {

  get validated(): boolean {
    return this.validation.app;
  }

  get responsive(): {
    enabled: boolean,
    fixedwidth: number
  } {
    if (!(this.projectsettings === null || this.projectsettings === undefined)
      && !(this.projectsettings.responsive === null || this.projectsettings.responsive === undefined)) {
      return this.projectsettings.responsive;

    } else {
      return this.appSettings.octra.responsive;
    }
  }

  get projectsettings(): ProjectSettings {
    return this._projectsettings;
  }

  get appSettings(): AppSettings {
    return this._appSettings;
  }

  get guidelines(): any {
    return this._guidelines;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(value: boolean) {
    this._loaded = value;
  }

  get log(): string {
    return this._log;
  }

  set log(value: string) {
    this._log = value;
  }

  get filename(): string {
    return this._filename;
  }

  get validationmethod(): (string, any) => any[] {
    return this._validationmethod;
  }

  get tidyUpMethod(): (string, any) => string {
    return this._tidyUpMethod;
  }

  public get allloaded(): boolean {
    return (
      !(this.projectsettings === null || this.projectsettings === undefined)
    );
  }

  get isDBLoadded(): boolean {
    return this._isDBLoadded;
  }

  constructor(private http: HttpClient,
              private appStorage: AppStorageService, private api: APIService, private langService: TranslateService) {
    this.subscrmanager = new SubscriptionManager();
  }

  public dbloaded = new EventEmitter<any>();
  public appsettingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  public projectsettingsloaded: EventEmitter<any> = new EventEmitter<any>();
  public validationmethodloaded = new EventEmitter<void>();
  public audioloaded: EventEmitter<any> = new EventEmitter<any>();
  public guidelinesloaded = new EventEmitter<any>();
  private test: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  public settingsloaded: Observable<boolean> = this.test.asObservable();
  private subscrmanager: SubscriptionManager;
  private validation: any = {
    app: false
  };

  private _projectsettings: ProjectSettings;

  private _appSettings: AppSettings;

  private _guidelines: any;

  private _loaded = false;

  private _log = '';

  private _filename: string;

  private _validationmethod: (string, any) => any[] = null;

  private _tidyUpMethod: (string, any) => string = null;

  private _isDBLoadded = false;

  public static queryParamsSet(route: ActivatedRoute): boolean {
    const params = route.snapshot.queryParams;
    return (
      params.hasOwnProperty('audio') &&
      params.hasOwnProperty('embedded')
    );
  }

  public static validateJSON(filename: string, json: any, schema: any): boolean {
    if (!(json === null || json === undefined) && !(schema === null || schema === undefined)) {
      const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
      const validate = ajv.compile(schema);
      const valid = validate(json);
      if (!valid) {
        for (const err in validate.errors) {
          if (validate.errors.hasOwnProperty(err)) {
            const errObj: any = (validate.errors['' + err + '']);
            if (errObj.hasOwnProperty('dataPath') && !(errObj.dataPath === null || errObj.dataPath === undefined)) {
              console.error(`JSON Validation Error (${filename}): ${errObj.dataPath} ${errObj.message}`);
            }
          }
        }
      } else {
        return true;
      }
    }
    return false;
  }

  public loadDB = (appRoute: ActivatedRoute) => {

    // check for Updates
    if (SettingsService.queryParamsSet(appRoute)) {
      // URL MODE, overwrite db name with 'url'
      this.appSettings.octra.database.name = 'url';
    } else {
    }

    const umanager = new UpdateManager(this.appStorage);
    umanager.checkForUpdates(this.appSettings.octra.database.name).then((idb) => {

      const audioURL = appRoute.snapshot.queryParams.audio;
      const transcriptURL = (appRoute.snapshot.queryParams.transcript !== undefined)
        ? appRoute.snapshot.queryParams.transcript : null;
      const embedded = appRoute.snapshot.queryParams.embedded;

      this.appStorage.urlParams.audio = audioURL;
      this.appStorage.urlParams.transcript = transcriptURL;
      this.appStorage.urlParams.embedded = (embedded === '1');
      this.appStorage.urlParams.host = appRoute.snapshot.queryParams.host;

      // load from indexedDB
      this.appStorage.load(idb).then(
        () => {
          // define languages
          const languages = this.appSettings.octra.languages;
          const browserLang = this.langService.getBrowserLang();
          this.langService.addLangs(languages);

          // check if browser language is available in translations
          if ((this.appStorage.language === null || this.appStorage.language === undefined) || this.appStorage.language === '') {
            if ((this.langService.getLangs().find((value) => {
              return value === browserLang;
            })) !== undefined) {
              this.langService.use(browserLang);
            } else {
              // use first language defined as default language
              this.langService.use(languages[0]);
            }
          } else {
            if ((this.langService.getLangs().find((value) => {
              return value === this.appStorage.language;
            })) !== undefined) {
              this.langService.use(this.appStorage.language);
            } else {
              this.langService.use(languages[0]);
            }
          }

          // if url mode, set it in options
          if (SettingsService.queryParamsSet(appRoute)) {
            this.appStorage.usemode = 'url';
            this.appStorage.LoggedIn = true;
          }


          if (this.validated) {

            // settings have been loaded
            if ((this.appSettings === null || this.appSettings === undefined)) {
              throw new Error('config.json does not exist');
            } else {
              if (this.validated) {
                this.api.init(this.appSettings.audio_server.url + 'WebTranscribe');
              }
            }
          }
          umanager.destroy();
          this._isDBLoadded = true;
          this.dbloaded.emit();
        }
      ).catch((error) => {
        this.dbloaded.error(error);
        console.error(error);
      });
    }).catch((error) => {
      this.dbloaded.error(error);
      console.error(error.target.error);
    });
  }

  public loadProjectSettings: () => Promise<void> = () => {
    return new Promise<void>((resolve, reject) => {
      this.loadSettings(
        {
          loading: 'Load project settings...'
        },
        {
          json: './config/localmode/projectconfig.json',
          schema: './assets/schemata/projectconfig.schema.json'
        },
        {
          json: 'projectconfig.json',
          schema: 'projectconfig.schema.json'
        },
        (result: ProjectSettings) => {
          this._projectsettings = result;
        },
        () => {
          console.log('Projectconfig loaded.');
          resolve();
          this.projectsettingsloaded.emit(this._projectsettings);
        },
        (error) => {
          console.error(error);
          reject(error);
        }
      );
    });
  }

  public loadGuidelines = (language: string, url: string) => {
    this.loadSettings(
      {
        loading: 'Load guidelines (' + language + ')...'
      },
      {
        json: url,
        schema: './assets/schemata/guidelines.schema.json'
      },
      {
        json: 'guidelines_' + language + '.json',
        schema: 'guidelines.schema.json'
      },
      (result) => {
        this._guidelines = result;
      },
      () => {
        console.log('Guidelines loaded.');
        this.loadValidationMethod(this._guidelines.meta.validation_url);
        this.guidelinesloaded.emit(this._guidelines);
      },
      (error) => {
        console.error(error);
      }
    );
  }
  public loadValidationMethod: ((url: string) => Subscription) = (url: string) => {
    console.log('Load methods...');
    return Functions.uniqueHTTPRequest(this.http, false, {
      responseType: 'text'
    }, url, null).subscribe(
      () => {
        const js = document.createElement('script');

        js.type = 'text/javascript';
        js.src = url;
        js.id = 'validationJS';
        js.onload = () => {
          if (
            (typeof validateAnnotation !== 'undefined') && typeof validateAnnotation === 'function' &&
            (typeof tidyUpAnnotation !== 'undefined') && typeof tidyUpAnnotation === 'function'
          ) {
            this._validationmethod = validateAnnotation;
            this._tidyUpMethod = tidyUpAnnotation;
            console.log('Methods loaded.');
            this.validationmethodloaded.emit();
          } else {
            this._log += 'Loading functions failed [Error: S02]';
          }
        };
        document.body.appendChild(js);
      },
      () => {
        console.error('Loading functions failed [Error: S01]');
        this.validationmethodloaded.emit();
      }
    );
  }
  public loadAudioFile: ((audioService: AudioService) => void) = (audioService: AudioService) => {
    console.log('Load audio file 2...');
    if ((this.appStorage.usemode === null || this.appStorage.usemode === undefined)) {
      console.error(`usemode is null`);
    }
    if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'url') {
      // online
      if (!(this.appStorage.audioURL === null || this.appStorage.audioURL === undefined)) {
        let src = '';
        if (this.appStorage.usemode === 'online') {
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

        audioService.loadAudio(src, () => {
          console.log('Audio loaded.');

          this.audioloaded.emit({status: 'success'});
        }, () => {
          this._log += 'Loading audio file failed<br/>';
        });
      } else {
        console.error('audio src is null');
        this.audioloaded.emit({status: 'error'});
      }
    } else if (this.appStorage.usemode === 'local') {
      // local mode
      if (!(this.appStorage.sessionfile === null || this.appStorage.sessionfile === undefined)
        && !(this.appStorage.sessionfile.name === null || this.appStorage.sessionfile.name === undefined)) {
        this._filename = this.appStorage.sessionfile.name;
        this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));

        console.log('Audio loaded.');
        this.audioloaded.emit({status: 'success'});

      } else {
        console.error('session file is null.');
      }
    }
  }
  private triggerSettingsLoaded = () => {
    if (this.validated) {
      this.loaded = true;
      this.test.next(true);
    }
  }

  public loadApplicationSettings(appRoute: ActivatedRoute): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.subscrmanager.add(
        this.appsettingsloaded.subscribe(this.triggerSettingsLoaded)
      );

      this.loadSettings(
        {
          loading: 'Load application settings...'
        },
        {
          json: './config/appconfig.json',
          schema: './assets/schemata/appconfig.schema.json'
        },
        {
          json: 'appconfig.json',
          schema: 'appconfig.schema.json'
        },
        (result: AppSettings) => {
          this._appSettings = result;
        },
        () => {
          console.log('AppSettings loaded.');
          this.validation.app = true;

          this.appsettingsloaded.emit(true);
          // App settings loaded

          // settings finally loaded
          resolve();

          this.loadDB(appRoute);
        },
        (error) => {
          console.error(error);
          reject();
        }
      );
    });
  }

  public destroy() {
    this.subscrmanager.destroy();
  }

  public clearSettings() {
    this._guidelines = null;
    this._projectsettings = null;
    this._validationmethod = null;
    this._tidyUpMethod = null;
  }

  private loadSettings(messages: any, urls: any, filenames: any, onhttpreturn: (any) => void, onvalidated: () => void,
                       onerror: (error: string) => void) {
    if (
      messages.hasOwnProperty('loading') &&
      urls.hasOwnProperty('json') && urls.hasOwnProperty('schema') &&
      filenames.hasOwnProperty('json') && filenames.hasOwnProperty('schema')
    ) {
      console.log(messages.loading);
      this.subscrmanager.add(Functions.uniqueHTTPRequest(this.http, false, null, urls.json, null).subscribe(
        (appsettings: AppSettings) => {
          onhttpreturn(appsettings);

          this.subscrmanager.add(Functions.uniqueHTTPRequest(this.http, false, null, urls.schema, null).subscribe(
            (schema) => {
              console.log(filenames.json + ' schema file loaded');

              const validationOK = SettingsService.validateJSON(filenames.json, appsettings, schema);

              if (validationOK) {
                onvalidated();
              }
            },
            () => {
              console.error(filenames.schema + ' could not be loaded!');
            }
          ));
        },
        (error) => {
          onerror(error);
          this._log += 'Loading ' + filenames.json + ' failed<br/>';
        }
      ));
    } else {
      throw new Error('parameters of loadSettings() are not correct.');
    }
  }

  /**
   * checks jif the specific theme is active
   */
  public isTheme(theme: string) {
    const selectedTheme = (
      isNullOrUndefined(this.projectsettings.octra)
      || isNullOrUndefined(this.projectsettings.octra.theme)
    )
      ? 'default' : this.projectsettings.octra.theme;

    return (selectedTheme === theme);
  }
}
