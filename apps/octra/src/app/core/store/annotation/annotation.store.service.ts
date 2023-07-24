import { Injectable } from '@angular/core';
import { getModeState, LoginMode, RootState } from '../index';
import { Store } from '@ngrx/store';
import { AnnotationActions } from './annotation.actions';
import { OnlineModeActions } from '../modes/online-mode/online-mode.actions';
import { getTranscriptFromIO } from '@octra/utilities';

@Injectable({
  providedIn: 'root',
})
export class AnnotationStoreService {
  task$ = this.store.select(
    (state: RootState) => getModeState(state)?.onlineSession?.task
  );

  textInput$ = this.store.select((state: RootState) => {
    if (
      state.application.mode === undefined ||
      state.application.mode === LoginMode.LOCAL ||
      state.application.mode === LoginMode.URL
    ) {
      return undefined;
    }

    const mode = getModeState(state);
    const result = getTranscriptFromIO(mode?.onlineSession?.task?.inputs ?? []);
    return result;
  });

  constructor(private store: Store<RootState>) {}

  setLogs(value: any[], mode: LoginMode) {
    this.store.dispatch(
      AnnotationActions.saveLogs.do({
        logs: value ?? [],
        mode,
      })
    );
  }

  quit(clearSession: boolean, freeTask: boolean, redirectToProjects = false) {
    this.store.dispatch(
      AnnotationActions.quit.do({
        clearSession,
        freeTask,
        redirectToProjects
      })
    );
  }

  sendAnnotation() {
    this.store.dispatch(AnnotationActions.sendAnnotation.do());
  }

  changeComment(comment: string) {
    this.store.dispatch(
      OnlineModeActions.changeComment.do({
        mode: LoginMode.ONLINE,
        comment,
      })
    );
  }

  resumeTaskManually() {
    this.store.dispatch(AnnotationActions.resumeTaskManually.do());
  }
}
