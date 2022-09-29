import {AnnotationActions} from '../../annotation/annotation.actions';
import {createAction, props} from '@ngrx/store';
import {SessionFile} from '../../../obj/SessionFile';
import {LoginMode} from '../../index';

export class LocalModeActions extends AnnotationActions {
  static override context: 'LocalMode';

  public static login = createAction(
    `[${LocalModeActions.context}] Login Local`,
    props<{
      files: File[],
      sessionFile: SessionFile,
      removeData: boolean,
      mode: LoginMode.LOCAL
    }>()
  );

  public static setSessionFile = createAction(
    `[${LocalModeActions.context}] Set SessionFile`,
    props<{
      sessionFile: SessionFile
    }>()
  );

  public static override clearSessionStorageSuccess = createAction(
    `[${LocalModeActions.context}] Clear Session Success`
  );
}


