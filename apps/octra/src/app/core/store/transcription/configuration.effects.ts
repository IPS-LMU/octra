import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {exhaustMap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {ConfigurationService} from '../../shared/service/configuration.service';
import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {isUnset, uniqueHTTPRequest} from '@octra/utilities';
import {HttpClient} from '@angular/common/http';
import {TranslocoService} from '@ngneat/transloco';
import {ConfigurationActions} from '../configuration/configuration.actions';

declare var validateAnnotation: ((string, any) => any);
declare var tidyUpAnnotation: ((string, any) => any);

@Injectable()
export class ConfigurationEffects {
  loadAppConfig$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadAppConfiguration),
    exhaustMap(() => {
      const subject = new Subject<Action>();

      this.configurationService.loadSettings(
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
        (appConfiguration: AppSettings) => {
          subject.next(ConfigurationActions.appConfigurationLoadSuccess({
            appConfiguration
          }));
        },
        (error) => {
          subject.next(ConfigurationActions.appConfigurationLoadFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadProjectConfig$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadAppConfiguration),
    exhaustMap(() => {
      const subject = new Subject<Action>();

      this.configurationService.loadSettings(
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
        (projectConfig: ProjectSettings) => {
          subject.next(ConfigurationActions.projectConfigurationLoaded({
            projectConfig
          }));
        },
        (error) => {
          subject.next(ConfigurationActions.projectConfigurationLoadedFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadGuidelines$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.projectConfigurationLoaded, ConfigurationActions.loadGuidelines),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      let language = this.languageService.getActiveLang();

      const found = action.projectConfig.languages.find((x) => {
        return x === language;
      });
      if (isUnset(found)) {
        // fall back to first defined language
        language = action.projectConfig.languages[0];
      }
      const url = './config/localmode/guidelines/guidelines_' + language + '.json';

      this.configurationService.loadSettings(
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
        (guidelines: any) => {
          subject.next(ConfigurationActions.loadGuidelinesSuccess({
            guidelines
          }));
        },
        (error) => {
          subject.next(ConfigurationActions.loadGuidelinesFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadValidationMethods$ = createEffect(() => this.actions$.pipe(
    ofType(ConfigurationActions.loadGuidelinesSuccess),
    exhaustMap((action) => {
      const subject = new Subject<Action>();

      uniqueHTTPRequest(this.http, false, {
        responseType: 'text'
      }, action.guidelines.meta.validation_url, null).subscribe(
        () => {
          const js = document.createElement('script');

          js.type = 'text/javascript';
          js.src = action.guidelines.meta.validation_url;
          js.id = 'validationJS';
          js.onload = () => {
            if (
              (typeof validateAnnotation !== 'undefined') && typeof validateAnnotation === 'function' &&
              (typeof tidyUpAnnotation !== 'undefined') && typeof tidyUpAnnotation === 'function'
            ) {
              subject.next(ConfigurationActions.loadMethodsSuccess({
                validate: validateAnnotation,
                tidyUp: tidyUpAnnotation
              }));
              console.log('Methods loaded.');
            } else {
              subject.next(ConfigurationActions.loadMethodsFailed({
                error: 'Loading functions failed [Error: S02]'
              }));
            }
          };
          document.body.appendChild(js);
        },
        () => {
          subject.next(ConfigurationActions.loadMethodsFailed({
            error: 'Loading functions failed [Error: S01]'
          }));
        }
      );

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private configurationService: ConfigurationService,
              private http: HttpClient,
              private languageService: TranslocoService) {}

}
