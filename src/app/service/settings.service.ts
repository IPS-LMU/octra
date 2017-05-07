import {EventEmitter, Injectable} from '@angular/core';
import 'rxjs/Rx';
import {Http} from '@angular/http';

import {SubscriptionManager} from '../shared';
import {AppConfigValidator} from '../validator/AppConfigValidator';
import {ConfigValidator} from '../shared/ConfigValidator';
import {ProjectConfiguration} from '../types/Settings/project-configuration';
import {Subscription} from 'rxjs/Subscription';
import {SessionService} from './session.service';
import {AudioService} from './audio.service';
import {isFunction, isNullOrUndefined} from 'util';
import {Logger} from '../shared/Logger';
import {ProjectConfigValidator} from '../validator/ProjectConfigValidator';
import {AppSettings} from '../types/Settings/app-settings';

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

  public settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
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
    this.subscrmanager.add(
      this.app_settingsloaded.subscribe(this.triggerSettingsLoaded)
    );
    this.getApplicationSettings();
  }

  getApplicationSettings() {
    Logger.log('Load Application Settings...');
    this.subscrmanager.add(this.http.request('./config/appconfig.json').subscribe(
      (result) => {
        this._app_settings = result.json();
        Logger.log('AppSettings loaded.');
        this.validation.app = this.validate(new AppConfigValidator(), this._app_settings);
        if (this.validation.app) {
          this.app_settingsloaded.emit(true);
        } else {
          Logger.err('appconfig.json validation error.');
        }
      },
      (error) => {
        this._log += 'Loading application config failed<br/>';
      }
    ));
  }

  public loadProjectSettings: () => Subscription = () => {
    Logger.log('Load Project Settings...');
    return this.http.request('./project/projectconfig.json').subscribe(
      (result) => {
        this._projectsettings = result.json();
        const validation = this.validate(new ProjectConfigValidator(), this._projectsettings);
        if (validation) {
          Logger.log('Projectconfig loaded.');
          this.projectsettingsloaded.emit(this._projectsettings);
        } else {
          Logger.err('projectconfig.json validation error.');
        }
      },
      (error) => {
        this._log += 'Loading project config failed<br/>';
      }
    );
  }

  public loadGuidelines: ((language: string, url: string) => Subscription) = (language: string, url: string) => {
    Logger.log('Load Guidelines (' + language + ')...');
    return this.http.get(url).subscribe(
      (response) => {
        const guidelines = response.json();
        Logger.log('Guidelines loaded.');
        this._guidelines = guidelines;
        this.loadValidationMethod(guidelines.meta.validation_url);
        this.guidelinesloaded.emit(guidelines);
      },
      (error) => {
        this._log += 'Loading guidelines failed<br/>';
      }
    );
  }

  public loadValidationMethod: ((url: string) => Subscription) = (url: string) => {
    Logger.log('Load Methods...');
    return this.http.get(url).subscribe(
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
    Logger.log('Load audio...');
    if (isNullOrUndefined(audioService.audiobuffer)) {
      this.subscrmanager.add(
        audioService.afterloaded.subscribe((result) => {
          Logger.log('Audio loaded.');
          this.audioloaded.emit(result);
        })
      );

      if (this.sessService.offline === false) {
        // online
        if (!isNullOrUndefined(this.sessService.audio_url)) {
          const src = this.app_settings.audio_server.url + this.sessService.audio_url;
          // extract filename
          this._filename = this.sessService.audio_url.substr(this.sessService.audio_url.lastIndexOf('/') + 1);
          this._filename = this._filename.substr(0, this._filename.lastIndexOf('.'));
          if (this._filename.indexOf('src=') > -1) {
            this._filename = this._filename.substr(this._filename.indexOf('src=') + 4);
          }

          audioService.loadAudio(src, () => {
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
            audioService.decodeAudio(t.result);
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
      this.settingsloaded.emit(true);
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
}
