import {createAction, props} from '@ngrx/store';
import {AnnotationState, AnnotationStateLevel} from '../index';
import {OIDBLevel, OIDBLink} from '@octra/annotation';

const context = 'Annotation';

export class AnnotationActions {
  public static setAnnotation = createAction(
    `[${context}] Set annotation`,
    props<{
      annotation: AnnotationState;
    }>()
  );

  public static clearAnnotation = createAction(
    `[${context}] Clear annotation`
  );

  public static overwriteAnnotation = createAction(
    `[${context}] Overwrite annotation`,
    props<{
      annotation: AnnotationState,
      saveToDB: boolean
    }>()
  );

  public static overwriteLinks = createAction(
    `[${context}] Overwrite links`,
    props<{
      links: OIDBLink[]
    }>()
  );

  public static changeAnnotationLevel = createAction(
    `[${context}] Change Annotation Level`,
    props<{
      id: number;
      level: AnnotationStateLevel;
      sortorder: number;
    }>()
  );

  public static addAnnotationLevel = createAction(
    `[${context}] Add Annotation Level`,
    props<OIDBLevel>()
  );

  public static removeAnnotationLevel = createAction(
    `[${context}] Remove Annotation Level`,
    props<{
      id: number
    }>()
  );

  public static setLevelCounter = createAction(
    `[${context}] Set Level Counter`,
    props<{
      levelCounter: number
    }>()
  );
}
