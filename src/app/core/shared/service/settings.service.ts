import {EventEmitter, Injectable} from '@angular/core';

import {SubscriptionManager} from '../';
import {ProjectSettings} from '../../obj/Settings/project-configuration';
import {Subscription} from 'rxjs/Subscription';
import {AppStorageService} from './appstorage.service';
import {AudioService} from './audio.service';
import {isFunction, isNullOrUndefined, isUndefined} from 'util';
import {Logger} from '../Logger';
import {AppSettings} from '../../obj/Settings/app-settings';
import {Functions} from '../Functions';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {AppInfo} from '../../../app.info';
import {HttpClient} from '@angular/common/http';
import {APIService} from './api.service';
import {TranslateService} from '@ngx-translate/core';
import {UpdateManager} from '../UpdateManager';
import {ActivatedRoute} from '@angular/router';

@Injectable()
export class SettingsService {
  public dbloaded = new EventEmitter<any>();
  set log(value: string) {
    this._log = value;
  }

  get log(): string {
    return this._log;
  }

  get filename(): string {
    return this._filename;
  }

  get guidelines(): any {
    return this._guidelines;
  }

  get tidyUpMethod(): (string, any) => string {
    return this._tidyUpMethod;
  }

  get validationmethod(): (string, any) => any[] {
    return this._validationmethod;
  }

  get projectsettings(): ProjectSettings {
    return this._projectsettings;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  set loaded(value: boolean) {
    this._loaded = value;
  }

  get validated(): boolean {
    return this.validation.app;
  }

  get app_settings(): AppSettings {
    return this._app_settings;
  }

  get responsive(): {
    enabled: boolean,
    fixedwidth: number
  } {
    if (!isNullOrUndefined(this.projectsettings) && !isNullOrUndefined(this.projectsettings.responsive)) {
      return this.projectsettings.responsive;

    } else {
      return this.app_settings.octra.responsive;
    }
  }

  private test: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  public settingsloaded: Observable<boolean> = this.test.asObservable();

  public app_settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  public projectsettingsloaded: EventEmitter<any> = new EventEmitter<any>();
  public validationmethodloaded = new EventEmitter<void>();
  public audioloaded: EventEmitter<any> = new EventEmitter<any>();
  public guidelinesloaded = new EventEmitter<any>();
  public loadDB = (appRoute: ActivatedRoute) => {

    // check for Updates
    if (this.queryParamsSet(appRoute)) {
      // URL MODE, overwrite db name with 'url'
      this.app_settings.octra.database.name = 'url';
      console.log('load db ' + this.app_settings.octra.database.name);
    } else {
      console.log(`no params`);
    }

    const umanager = new UpdateManager(this.appStorage);
    umanager.checkForUpdates(this.app_settings.octra.database.name).then((idb) => {

      const audio_url = appRoute.snapshot.queryParams['audio'];
      const transcript_url = (appRoute.snapshot.queryParams['transcript'] !== undefined) ? appRoute.snapshot.queryParams['transcript'] : null;
      const embedded = appRoute.snapshot.queryParams['embedded'];

      this.appStorage.url_params['audio'] = audio_url;
      this.appStorage.url_params['transcript'] = transcript_url;
      this.appStorage.url_params['embedded'] = (embedded === '1');
      this.appStorage.url_params['host'] = appRoute.snapshot.queryParams['host'];

      // load from indexedDB
      this.appStorage.load(idb).then(
        () => {
          // define languages
          const languages = this.app_settings.octra.languages;
          const browser_lang = this.langService.getBrowserLang();
          this.langService.addLangs(languages);

          // check if browser language is available in translations
          if (isNullOrUndefined(this.appStorage.language) || this.appStorage.language === '') {
            if (!isUndefined(this.langService.getLangs().find((value) => {
              return value === browser_lang;
            }))) {
              this.langService.use(browser_lang);
            } else {
              // use first language defined as default language
              this.langService.use(languages[0]);
            }
          } else {
            if (!isUndefined(this.langService.getLangs().find((value) => {
              return value === this.appStorage.language;
            }))) {
              this.langService.use(this.appStorage.language);
            } else {
              this.langService.use(languages[0]);
            }
          }

          // if url mode, set it in options
          if (this.queryParamsSet(appRoute)) {
            console.log(`PARAMS SET!`);
            this.appStorage.usemode = 'url';
            this.appStorage.LoggedIn = true;
          }


          if (this.validated) {
            console.log('loaded');

            // settings have been loaded
            if (isNullOrUndefined(this.app_settings)) {
              throw new Error('config.json does not exist');
            } else {
              if (this.validated) {
                console.log('settings valid');
                this.api.init(this.app_settings.audio_server.url + 'WebTranscribe');
              }
            }
          }
          umanager.destroy();
          this._isDBLoadded = true;
          this.dbloaded.emit();
        }
      ).catch((error) => {
        this.dbloaded.error(error);
        Logger.err(error);
      });
    }).catch((error) => {
      this.dbloaded.error(error);
      console.error(error.target.error);
    });
  };

  private subscrmanager: SubscriptionManager;

  private _projectsettings: ProjectSettings;
  private _app_settings: AppSettings;
  private _guidelines: any;
  private _loaded = false;

  constructor(private http: HttpClient,
              private appStorage: AppStorageService, private api: APIService, private langService: TranslateService) {
    this.subscrmanager = new SubscriptionManager();
  }

  private _log = '';

  private _filename: string;

  private _validationmethod: (string, any) => any[] = null;
  private _tidyUpMethod: (string, any) => string = null;

  private validation: any = {
    app: false
  };

  public get allloaded(): boolean {
    return (
      !isNullOrUndefined(this.projectsettings)
    );
  }

  private _isDBLoadded = false;

  get isDBLoadded(): boolean {
    return this._isDBLoadded;
  }

  public loadApplicationSettings(appRoute: ActivatedRoute): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.subscrmanager.add(
        this.app_settingsloaded.subscribe(this.triggerSettingsLoaded)
      );

      this.loadSettings(
        {
          loading: 'Load application settings...'
        },
        {
          json: './config/appconfig.json',
          schema: './schemata/appconfig.schema.json'
        },
        {
          json: 'appconfig.json',
          schema: 'appconfig.schema.json'
        },
        (result: AppSettings) => {
          this._app_settings = result;
        },
        () => {
          Logger.log('AppSettings loaded.');
          this.validation.app = true;

          this.app_settingsloaded.emit(true);
          // App Settings loaded

          // settings finally loaded
          resolve();

          this.loadDB(appRoute);
        },
        (error) => {
          Logger.err(error);
          reject();
        }
      );
    });
  }

  public loadProjectSettings = () => {
    this.loadSettings(
      {
        loading: 'Load project Settings...'
      },
      {
        json: './config/localmode/projectconfig.json',
        schema: './schemata/projectconfig.schema.json'
      },
      {
        json: 'projectconfig.json',
        schema: 'projectconfig.schema.json'
      },
      (result: ProjectSettings) => {
        this._projectsettings = result;
      },
      () => {
        Logger.log('Projectconfig loaded.');
        this.projectsettingsloaded.emit(this._projectsettings);
      },
      (error) => {
        Logger.err(error);
      }
    );
  };

  public loadGuidelines = (language: string, url: string) => {
    this.loadSettings(
      {
        loading: 'Load guidelines (' + language + ')...'
      },
      {
        json: url,
        schema: './schemata/guidelines.schema.json'
      },
      {
        json: 'guidelines_' + language + '.json',
        schema: 'guidelines.schema.json'
      },
      (result) => {
        this._guidelines = result;
      },
      () => {
        Logger.log('Guidelines loaded.');
        this.loadValidationMethod(this._guidelines.meta.validation_url);
        this.guidelinesloaded.emit(this._guidelines);
      },
      (error) => {
        Logger.err(error);
      }
    );
  };

  public loadValidationMethod: ((url: string) => Subscription) = (url: string) => {
    Logger.log('Load methods...');
    return Functions.uniqueHTTPRequest(this.http, false, {
      responseType: 'text'
    }, url, null).subscribe(
      (response) => {
        const js = document.createElement('script');

        js.type = 'text/javascript';
        js.src = url;
        js.id = 'validationJS';
        js.onload = () => {
          if (
            (typeof validateAnnotation !== 'undefined') && isFunction(validateAnnotation) &&
            (typeof tidyUpAnnotation !== 'undefined') && isFunction(tidyUpAnnotation)
          ) {
            this._validationmethod = validateAnnotation;
            this._tidyUpMethod = tidyUpAnnotation;
            Logger.log('Methods loaded.');
            this.validationmethodloaded.emit();
          } else {
            this._log += 'Loading functions failed [Error: S02]';
          }
        };
        document.body.appendChild(js);
      },
      (error) => {
        console.error('Loading functions failed [Error: S01]');
        this.validationmethodloaded.emit();
      }
    );
  };

  public loadAudioFile: ((audioService: AudioService) => void) = (audioService: AudioService) => {
    Logger.log('Load audio file 2...');
    if (isNullOrUndefined(this.appStorage.usemode)) {
      console.error(`usemode is null`);
    }
    if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'url') {
      // online
      if (!isNullOrUndefined(this.appStorage.audio_url)) {
        let src = '';
        if (this.appStorage.usemode === 'online') {
          src = this.app_settings.audio_server.url + this.appStorage.audio_url;
        } else {
          src = this.appStorage.audio_url;
        }
        // extract filename
        this._filename = this.appStorage.audio_url.substr(this.appStorage.audio_url.lastIndexOf('/') + 1);
        const fullname = this._filename;
        this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));
        if (this._filename.indexOf('src=') > -1) {
          this._filename = this._filename.substr(this._filename.indexOf('src=') + 4);
        }

        audioService.loadAudio(src, () => {
          Logger.log('Audio loaded.');

          this.audioloaded.emit({status: 'success'});
        }, (err) => {
          const errMsg = err;
          this._log += 'Loading audio file failed<br/>';
        });
      } else {
        console.error('audio src is null');
        this.audioloaded.emit({status: 'error'});
      }
    } else if (this.appStorage.usemode === 'local') {
      // local mode
      if (!isNullOrUndefined(this.appStorage.sessionfile)
        && !isNullOrUndefined(this.appStorage.sessionfile.name)) {
        this._filename = this.appStorage.sessionfile.name;
        this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));

        // read file
        const reader = new FileReader();

        reader.onloadend = (ev) => {
          const t: any = ev.target;
          if (audioService.audiomanagers.length === 0) {
            AudioManager.decodeAudio(this.appStorage.sessionfile.name, t.result, AppInfo.audioformats, true).then(
              (audiomanager: AudioManager) => {
                audioService.registerAudioManager(audiomanager);
                Logger.log('Audio loaded.');
                this.audioloaded.emit({status: 'success'});
              }
            );
          } else {
            Logger.log('Audio loaded.');
            this.audioloaded.emit({status: 'success'});
          }
        };

        if (!isNullOrUndefined(this.appStorage.file)) {
          // read audio file to array buffer
          reader.readAsArrayBuffer(this.appStorage.file);
        }
      } else {
        console.error('session file is null.');
      }
    }
  };

  private triggerSettingsLoaded = () => {
    if (this.validated) {
      this.loaded = true;
      this.test.next(true);
    }
  };

  public destroy() {
    this.subscrmanager.destroy();
  }

  public clearSettings() {
    this._guidelines = null;
    this._projectsettings = null;
    this._validationmethod = null;
    this._tidyUpMethod = null;
  }

  private validateJSON(filename: string, json: any, schema: any): boolean {
    if (!isNullOrUndefined(json) && !isNullOrUndefined(schema)) {
      const ajv = new Ajv(); // options can be passed, e.g. {allErrors: true}
      const validate = ajv.compile(schema);
      const valid = validate(json);
      if (!valid) {
        for (const err in validate.errors) {
          if (validate.errors.hasOwnProperty(err)) {
            const err_obj = (validate.errors['' + err + '']);
            Logger.err(`JSON Validation Error (${filename}): ${err_obj.dataPath} ${err_obj.message}`);
          }
        }
      } else {
        return true;
      }
    }
    return false;
  }

  private loadSettings(messages: any, urls: any, filenames: any, onhttpreturn: (any) => void, onvalidated: () => void,
                       onerror: (error: string) => void) {
    if (
      messages.hasOwnProperty('loading') &&
      urls.hasOwnProperty('json') && urls.hasOwnProperty('schema') &&
      filenames.hasOwnProperty('json') && filenames.hasOwnProperty('schema')
    ) {
      Logger.log(messages.loading);
      this.subscrmanager.add(Functions.uniqueHTTPRequest(this.http, false, null, urls.json, null).subscribe(
        (appsettings: AppSettings) => {
          onhttpreturn(appsettings);

          this.subscrmanager.add(Functions.uniqueHTTPRequest(this.http, false, null, urls.schema, null).subscribe(
            (schema) => {
              Logger.log(filenames.json + ' schema file loaded');

              const validation_ok = this.validateJSON(filenames.json, appsettings, schema);

              if (validation_ok) {
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

  queryParamsSet(route: ActivatedRoute): boolean {
    const params = route.snapshot.queryParams;
    return (
      params.hasOwnProperty('audio') &&
      params.hasOwnProperty('embedded')
    );
  }
}
