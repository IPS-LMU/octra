import {AnnotationActions} from '../../annotation/annotation.actions';
import {createAction, props} from '@ngrx/store';
import {SessionFile} from '../../../obj/SessionFile';

export class LocalModeActions extends AnnotationActions {
  static context: 'LocalMode';

  public static login = createAction(
    `[${LocalModeActions.context}] Login Local`,
    props<{
      files: File[],
      sessionFile: SessionFile,
      removeData: boolean
    }>()
  );

  public static setSessionFile = createAction(
    `[${LocalModeActions.context}] Set SessionFile`,
    props<{
      sessionFile: SessionFile
    }>()
  );

  public static clearSessionStorageSuccess = createAction(
    `[${LocalModeActions.context}] Clear Session Success`
  );
}


