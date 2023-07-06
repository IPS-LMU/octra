import { createAction, props } from '@ngrx/store';
import { ProjectSettings } from '../../obj/Settings';

const context = 'Configuration';

export class ConfigurationActions {
  // TODO remove this class
  public static projectConfigurationLoaded = createAction(
    `[${context}] Project config loaded success`,
    props<{
      projectConfig: ProjectSettings;
    }>()
  );

  public static loadGuidelines = createAction(
    `[${context}] Load guidelines`,
    props<{
      projectConfig: ProjectSettings;
    }>()
  );

  public static loadGuidelinesSuccess = createAction(
    `[${context}] Load Guidelines Success`,
    props<{
      guidelines: any;
    }>()
  );

  public static loadMethodsSuccess = createAction(
    `[${context}] Load Methods Success`,
    props<{
      validate: (transcript: string, guidelines: any) => any;
      tidyUp: (transcript: string, guidelines: any) => any;
    }>()
  );

  public static loadMethodsFailed = createAction(
    `[${context}] Load Methods Failed`,
    props<{
      error: string;
    }>()
  );
}
