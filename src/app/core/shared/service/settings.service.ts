import {EventEmitter, Injectable} from '@angular/core';

import {SubscriptionManager} from '../';
import {ProjectSettings} from '../../obj/Settings/project-configuration';
import {Subscription} from 'rxjs/Subscription';
import {AppStorageService} from './appstorage.service';
import {AudioService} from './audio.service';
import {isFunction, isNullOrUndefined} from 'util';
import {Logger} from '../Logger';
import {AppSettings} from '../../obj/Settings/app-settings';
import {Functions} from '../Functions';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {AppInfo} from '../../../app.info';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class SettingsService {
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

  private subscrmanager: SubscriptionManager;

  private _projectsettings: ProjectSettings;
  private _app_settings: AppSettings;
  private _guidelines: any;
  private _loaded = false;
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

  constructor(private http: HttpClient,
              private appStorage: AppStorageService) {
    this.subscrmanager = new SubscriptionManager();
  }

  public getApplicationSettings() {

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
      }
    );
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
      }
    );
  }

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
      }
    );
  }

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
        this._log += 'Loading functions failed [Error: S01]<br/>';
        console.error(error);
      }
    );
  }

  public loadAudioFile: ((audioService: AudioService) => void) = (audioService: AudioService) => {
    Logger.log('Load audio file 2...');
    if (!this.appStorage.uselocalmode) {
      // online
      if (!isNullOrUndefined(this.appStorage.audio_url)) {
        const src = this.app_settings.audio_server.url + this.appStorage.audio_url;
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
    } else {
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
  }

  private triggerSettingsLoaded = () => {
    if (this.validated) {
      this.loaded = true;
      this.test.next(true);
    }
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

  private loadSettings(messages: any, urls: any, filenames: any, onhttpreturn: (any) => void, onvalidated: () => void) {
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
          this._log += 'Loading ' + filenames.json + ' failed<br/>';
        }
      ));
    } else {
      throw new Error('parameters of loadSettings() are not correct.');
    }
  }
}
