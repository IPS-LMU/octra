import {EventEmitter, Injectable} from '@angular/core';
import 'rxjs/Rx';
import {Http} from '@angular/http';

import {SubscriptionManager} from '../';
import {ConfigValidator} from '../../obj/ConfigValidator';
import {ProjectConfiguration} from '../../obj/Settings/project-configuration';
import {Subscription} from 'rxjs/Subscription';
import {SessionService} from './session.service';
import {AudioService} from './audio.service';
import {isFunction, isNullOrUndefined} from 'util';
import {Logger} from '../Logger';
import {AppSettings} from '../../obj/Settings/app-settings';
import {Functions} from '../Functions';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {WavFormat} from '../../obj/media/audio/AudioFormats/WavFormat';
import {AppInfo} from '../../../app.info';

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

  get projectsettings(): ProjectConfiguration {
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

  get app_settings(): any {
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

  private app_settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  public projectsettingsloaded: EventEmitter<any> = new EventEmitter<any>();
  public validationmethodloaded = new EventEmitter<void>();
  public audioloaded: EventEmitter<any> = new EventEmitter<any>();
  public guidelinesloaded = new EventEmitter<any>();

  private subscrmanager: SubscriptionManager;

  private _projectsettings: ProjectConfiguration;
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

  constructor(private http: Http,
              private sessService: SessionService) {
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
      (result) => {
        this._app_settings = result.json();
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
      (result) => {
        this._projectsettings = result.json();
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
        this._guidelines = result.json();
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
    return Functions.uniqueHTTPRequest(this.http, false, null, url, null).subscribe(
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
      }
      ,
      (error) => {
        this._log += 'Loading functions failed [Error: S01]<br/>';
      }
    );
  }

  public loadAudioFile: ((audioService: AudioService) => void) = (audioService: AudioService) => {
    Logger.log('Load audio file 2...');
    if (audioService.audiomanagers.length === 0) {

      if (this.sessService.offline === false) {
        // online
        if (!isNullOrUndefined(this.sessService.audio_url)) {
          const src = this.app_settings.audio_server.url + this.sessService.audio_url;
          // extract filename
          this._filename = this.sessService.audio_url.substr(this.sessService.audio_url.lastIndexOf('/') + 1);
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
        }
      } else {
        // local mode
        if (!isNullOrUndefined(this.sessService.sessionfile)
          && !isNullOrUndefined(this.sessService.sessionfile.name)) {
          this._filename = this.sessService.sessionfile.name;
          this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));

          // read file
          const reader = new FileReader();

          reader.onloadend = (ev) => {
            const t: any = ev.target;
            AudioManager.decodeAudio(this.sessService.sessionfile.name, t.result, AppInfo.audioformats).then(
              (audiomanager: AudioManager) => {
                audioService.registerAudioManager(audiomanager);
                Logger.log('Audio loaded.');
                this.audioloaded.emit({status: 'success'});
              }
            );
          };

          if (!isNullOrUndefined(this.sessService.file)) {
            // read audio file to array buffer
            reader.readAsArrayBuffer(this.sessService.file);
          }
        } else {
          console.error('session file is null.');
        }
      }
    } else {
      this.audioloaded.emit({
        status: 'success'
      });
    }
  }

  private triggerSettingsLoaded = () => {
    if (this.validated) {
      this.loaded = true;
      this.test.next(true);
    }
  }

  private validate(validator: ConfigValidator, settings: any): boolean {
    // validate config

    for (const setting in settings) {
      if (settings.hasOwnProperty(setting)) {
        const result = validator.validate(setting, settings['' + setting + '']);
        if (!result.success) {
          console.error(result.error);
          return false;
        }
      }
    }
    return true;
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
        (result) => {
          onhttpreturn(result);

          this.subscrmanager.add(Functions.uniqueHTTPRequest(this.http, false, null, urls.schema, null).subscribe(
            (result2) => {

              Logger.log(filenames.json + ' schema file loaded');

              const schema = result2.json();
              const json = result.json();

              const validation_ok = this.validateJSON(filenames.json, json, schema);

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
