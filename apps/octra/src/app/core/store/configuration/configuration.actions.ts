import {createAction, props} from '@ngrx/store';
import {AppSettings, ProjectSettings} from '../../obj/Settings';

const context = 'Configuration';

export const loadAppConfiguration = createAction(
  `[${context}] Load app configuration`
);

export const appConfigurationLoadSuccess = createAction(
  `[${context}] App config loaded success`,
  props<{
    appConfig: AppSettings
  }>()
);

export const projectConfigurationLoadFailed = createAction(
  `[${context}] App config loaded failed`,
  props<{
    error: string;
  }>()
);

export const loadProjectConfiguration = createAction(
  `[${context}] Load project configuration`
);

export const projectConfigurationLoaded = createAction(
  `[${context}] Project config loaded success`,
  props<{
    projectConfig: ProjectSettings
  }>()
);

export const projectConfigurationLoadedFailed = createAction(
  `[${context}] Project config loaded failed`,
  props<{
    error: string;
  }>()
);

export const loadGuidelines = createAction(
  `[${context}] Load guidelines`
);




