import { Injectable } from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import * as fromConfigurationActions from '../configuration/configuration.actions';
import {exhaustMap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {ConfigurationService} from '../../shared/service/configuration.service';
import {AppSettings, ProjectSettings} from '../../obj/Settings';

@Injectable()
export class ConfigurationEffects {
  loadProjectConfig$ = createEffect(() => this.actions$.pipe(
    ofType(fromConfigurationActions.loadAppConfiguration),
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
          subject.next(fromConfigurationActions.projectConfigurationLoaded({
            projectConfig
          }));
        },
        (error) => {
          subject.next(fromConfigurationActions.projectConfigurationLoadedFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  loadAppConfig$ = createEffect(() => this.actions$.pipe(
    ofType(fromConfigurationActions.loadAppConfiguration),
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
        (appConfig: AppSettings) => {
          subject.next(fromConfigurationActions.appConfigurationLoadSuccess({
            appConfig
          }));
        },
        (error) => {
          subject.next(fromConfigurationActions.projectConfigurationLoadedFailed({
            error
          }));
        }
      );

      return subject;
    })
  ));

  constructor(private actions$: Actions,
              private configurationService: ConfigurationService) {}

}
