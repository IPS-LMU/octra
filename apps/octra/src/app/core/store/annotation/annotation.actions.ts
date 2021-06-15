import {createAction, props} from '@ngrx/store';
import {AnnotationState, AnnotationStateLevel} from '../index';
import {OIDBLink} from '@octra/annotation';

export class AnnotationActions {
  protected static context = 'Annotation';

  public static logout = createAction(
    `[${AnnotationActions.context}] Logout`,
    props<{
      clearSession: boolean;
    }>()
  );


  public static setAudioURL = createAction(`[${AnnotationActions.context}] Set Audio URL`,
    props<{
      audioURL: string;
    }>()
  );

  public static clearSessionStorageSuccess = createAction(
    `[${AnnotationActions.context}] Clear Session Storage Success`,
  );

  public static clearSessionStorageFailed = createAction(
    `[${AnnotationActions.context}] Clear Session Storage Failed`,
  );

  public static clearWholeSession = createAction(
    `[${AnnotationActions.context}] Clear whole session`,
  );


  public static clearWholeSessionSuccess = createAction(
    `[${AnnotationActions.context}] Clear whole session success`,
  );

  public static clearWholeSessionFailed = createAction(
    `[${AnnotationActions.context}] Clear whole session failed`,
  );

  public static setAnnotation = createAction(
    `[${AnnotationActions.context}] Set annotation`,
    props<{
      annotation: AnnotationState;
    }>()
  );

  public static clearAnnotation = createAction(
    `[${AnnotationActions.context}] Clear annotation`
  );

  public static overwriteAnnotation = createAction(
    `[${AnnotationActions.context}] Overwrite annotation`,
    props<{
      annotation: AnnotationState,
      saveToDB: boolean
    }>()
  );

  public static overwriteLinks = createAction(
    `[${AnnotationActions.context}] Overwrite links`,
    props<{
      links: OIDBLink[]
    }>()
  );

  public static changeAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Change Annotation Level`,
    props<{
      level: AnnotationStateLevel;
      sortorder: number;
    }>()
  );

  public static addAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Add Annotation Level`,
    props<{
      level: AnnotationStateLevel
    }>()
  );

  public static removeAnnotationLevel = createAction(
    `[${AnnotationActions.context}] Remove Annotation Level`,
    props<{
      id: number
    }>()
  );

  public static setLevelCounter = createAction(
    `[${AnnotationActions.context}] Set Level Counter`,
    props<{
      levelCounter: number
    }>()
  );
}
