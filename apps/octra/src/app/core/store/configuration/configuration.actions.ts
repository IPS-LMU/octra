import { createAction, props } from "@ngrx/store";
import { AppSettings, ProjectSettings } from "../../obj/Settings";

const context = 'Configuration';

export class ConfigurationActions {
  public static loadAppConfiguration = createAction(
    `[${context}] Load app configuration`
  );

  public static appConfigurationLoadSuccess = createAction(
    `[${context}] App config loaded success`,
    props<{
      appConfiguration: AppSettings
    }>()
  );

  public static appConfigurationLoadFailed = createAction(
    `[${context}] App config loaded failed`,
    props<{
      error: string
    }>()
  );

  public static projectConfigurationLoadFailed = createAction(
    `[${context}] App config loaded failed`,
    props<{
      error: string;
    }>()
  );

  public static loadProjectConfiguration = createAction(
    `[${context}] Load project configuration`
  );

  public static projectConfigurationLoaded = createAction(
    `[${context}] Project config loaded success`,
    props<{
      projectConfig: ProjectSettings
    }>()
  );

  public static projectConfigurationLoadedFailed = createAction(
    `[${context}] Project config loaded failed`,
    props<{
      error: string;
    }>()
  );

  public static loadGuidelines = createAction(
    `[${context}] Load guidelines`,
    props<{
      projectConfig: ProjectSettings
    }>()
  );

  public static loadGuidelinesSuccess = createAction(
    `[${context}] Load Guidelines Success`,
    props<{
      guidelines: any
    }>()
  );

  public static loadGuidelinesFailed = createAction(
    `[${context}] Load Guidelines Failed`,
    props<{
      error: string
    }>()
  );

  public static loadMethodsSuccess = createAction(
    `[${context}] Load Methods Success`,
    props<{
      validate: (string, any) => any;
      tidyUp: (string, any) => any;
    }>()
  );

  public static loadMethodsFailed = createAction(
    `[${context}] Load Methods Failed`,
    props<{
      error: string
    }>()
  );
}
