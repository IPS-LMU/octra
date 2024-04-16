import { EventEmitter, Injectable } from '@angular/core';
import { SessionFile } from '../../obj/SessionFile';
import { SubscriptionManager, waitTillResultRetrieved } from '@octra/utilities';
import { getModeState, LoginMode, RootState } from '../../store';
import { Action, Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { ConsoleEntry } from './bug-report.service';
import { AnnotationActions } from '../../store/login-mode/annotation/annotation.actions';
import { ApplicationActions } from '../../store/application/application.actions';
import { IDBActions } from '../../store/idb/idb.actions';
import * as fromAnnotation from '../../store/login-mode/annotation';
import {
  AnnotationSessionState,
  AnnotationState,
} from '../../store/login-mode/annotation';
import { LoginModeActions } from '../../store/login-mode';
import { Observable, Subject, Subscription } from 'rxjs';
import { ProjectDto, TaskDto } from '@octra/api-types';
import { AuthenticationActions } from '../../store/authentication';
import {
  OctraAnnotationAnyLevel,
  OctraAnnotationSegment,
} from '@octra/annotation';

@Injectable({
  providedIn: 'root',
})
export class AppStorageService {
  get undoRedoDisabled(): boolean {
    return this._undoRedoDisabled;
  }

  get snapshot(): RootState {
    return this._snapshot;
  }

  get sessionfile(): SessionFile {
    return this._snapshot.localMode.sessionFile!;
  }

  get playOnHover(): boolean | undefined | null {
    return this._snapshot.application.options.playOnHover;
  }

  set playOnHover(value: boolean) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name: 'playOnHover',
        value,
      })
    );
  }

  get editorFont(): string | undefined | null {
    return this._snapshot.application.options.editorFont;
  }

  set editorFont(value: string) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name: 'editorFont',
        value,
      })
    );
  }

  get showFeedbackNotice(): boolean | undefined | null {
    return this._snapshot.application.options.showFeedbackNotice;
  }

  set showFeedbackNotice(value: boolean) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name: 'showFeedbackNotice',
        value,
      })
    );
  }

  public get currentTask(): TaskDto | undefined {
    const mode = getModeState(this._snapshot);
    return mode?.currentSession.task;
  }

  public get annotationChanged(): Observable<AnnotationState> {
    const subject = new Subject<AnnotationState>();
    this.store.select(fromAnnotation.selectAnnotation).subscribe((state) => {
      subject.next(state!);
    });
    return subject;
  }

  get reloaded(): boolean {
    return this._snapshot.application.reloaded;
  }

  set reloaded(value: boolean) {
    this.store.dispatch(
      ApplicationActions.setReloaded({
        reloaded: value,
      })
    );
  }

  set feedback(value: any) {
    this.store.dispatch(
      LoginModeActions.setFeedback({
        feedback: value,
        mode: this.useMode,
      })
    );
  }

  get language(): string {
    return this._snapshot.application.language;
  }

  set language(value: string) {
    this.store.dispatch(ApplicationActions.setAppLanguage({ language: value }));
  }

  get logging(): boolean {
    return getModeState(this._snapshot)?.logging.enabled ?? false;
  }

  set logging(value: boolean) {
    this.store.dispatch(
      AnnotationActions.setLogging.do({
        logging: value,
        mode: this.useMode,
      })
    );
  }

  get showLoupe(): boolean | undefined | null {
    return this._snapshot.application.options.showLoupe;
  }

  set showLoupe(value: boolean) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name: 'showLoupe',
        value,
      })
    );
  }

  get consoleEntries(): ConsoleEntry[] {
    return this._snapshot.application.consoleEntries;
  }

  set consoleEntries(consoleEntries: ConsoleEntry[]) {
    this.store.dispatch(
      ApplicationActions.setConsoleEntries({
        consoleEntries,
      })
    );
  }

  get easyMode(): boolean | undefined | null {
    return this._snapshot.application.options.easyMode;
  }

  set easyMode(value: boolean) {
    this.store.dispatch(
      ApplicationActions.setEasyMode({
        easyMode: value,
      })
    );
  }

  get annotationLevels(): OctraAnnotationAnyLevel<OctraAnnotationSegment>[] {
    return getModeState(this._snapshot)!.transcript!.levels;
  }

  get secondsPerLine(): number | undefined | null {
    return this._snapshot.application.options.secondsPerLine;
  }

  set secondsPerLine(value: number) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name: 'secondsPerLine',
        value,
      })
    );
    this.settingschange.next({
      key: 'secondsPerLine',
      value,
    });
  }

  get highlightingEnabled(): boolean | undefined | null {
    return this._snapshot.application?.options.highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this.store.dispatch(
      ApplicationActions.setHighlightingEnabled({
        highlightingEnabled: value,
      })
    );
  }

  private _undoRedoDisabled = false;

  constructor(private store: Store<RootState>, private actions: Actions) {
    this.subscrManager.add(
      this.store.subscribe((state: RootState) => {
        this._snapshot = state;
      })
    );
  }

  public saving: EventEmitter<string> = new EventEmitter<string>();
  public settingschange = new Subject<{
    key: string;
    value: any;
  }>();
  private subscrManager = new SubscriptionManager<Subscription>();
  private _snapshot!: RootState;

  get savingNeeded(): boolean {
    return getModeState(this._snapshot)!.savingNeeded;
  }

  set savingNeeded(value: boolean) {
    this.store.dispatch(
      AnnotationActions.setSavingNeeded.do({
        savingNeeded: value,
        mode: this.useMode,
      })
    );
  }

  set followPlayCursor(value: boolean) {
    this.store.dispatch(
      ApplicationActions.changeApplicationOption.do({
        name: 'followPlayCursor',
        value,
      })
    );
  }

  get followPlayCursor(): boolean | undefined | null {
    return this._snapshot.application.options.followPlayCursor;
  }

  get logs(): any[] {
    return getModeState(this._snapshot)!.logging.logs;
  }

  get onlineSession(): AnnotationSessionState | undefined {
    return getModeState(this._snapshot)?.currentSession;
  }

  get audioLoaded() {
    const modeState = getModeState(this._snapshot);
    if (modeState) {
      return modeState.audio.loaded;
    }
    return undefined;
  }

  public get audioVolume(): number | undefined | null {
    return this._snapshot?.application?.options?.audioSettings?.volume;
  }

  public set audioVolume(value: number) {
    this.store.dispatch(
      ApplicationActions.setAudioSettings({
        volume: value,
        speed: this.audioSpeed ?? 1,
      })
    );
  }

  public get audioSpeed(): number | undefined {
    return this._snapshot.application?.options?.audioSettings?.speed;
  }

  public set audioSpeed(value: number) {
    this.store.dispatch(
      ApplicationActions.setAudioSettings({
        speed: value,
        volume: this.audioVolume ?? 1,
      })
    );
  }

  get isSaving(): boolean {
    return getModeState(this._snapshot)!.isSaving;
  }

  set isSaving(value: boolean) {
    this.store.dispatch(
      AnnotationActions.setIsSaving.do({
        isSaving: value,
      })
    );
  }

  get useMode(): LoginMode {
    return this._snapshot.application.mode!;
  }

  get loggedIn(): boolean {
    return this._snapshot.application.loggedIn;
  }

  get interface(): string | undefined {
    return getModeState(this._snapshot)?.currentEditor;
  }

  set interface(newInterface: string | undefined) {
    this.store.dispatch(
      AnnotationActions.setCurrentEditor.do({
        currentEditor: newInterface!,
        mode: this.useMode,
      })
    );
  }

  public save(key: string, value: any): boolean {
    // TODO why not url?
    if (this.useMode !== LoginMode.URL) {
      if (key === 'annotation' || key === 'feedback') {
        this.isSaving = true;
        this.saving.emit('saving');
      }

      switch (key) {
        case 'annotation':
          this.changeAnnotationLevel(value.num, value.level)
            .then(() => {
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('success');
            })
            .catch((err) => {
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('error');
              console.error(`error on saving`);
              console.error(err);
            });
          break;
        case 'feedback':
          waitTillResultRetrieved<Actions, Action, void>(
            this.actions,
            IDBActions.saveTranscriptionFeedback.success,
            IDBActions.saveTranscriptionFeedback.fail
          )
            .then(() => {
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('success');
            })
            .catch((error) => {
              console.error(error);
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('success');
            });
          this.store.dispatch(
            LoginModeActions.setFeedback({
              mode: LoginMode.ONLINE,
              feedback: value,
            })
          );

          break;
        default:
          return false; // if key not found return false
      }
    }
    return true;
  }

  public afterSaving(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.isSaving || this.savingNeeded) {
        const subscr = this.saving.subscribe(
          () => {
            subscr.unsubscribe();
            resolve();
          },
          (err) => {
            subscr.unsubscribe();
            reject(err);
          }
        );
      } else {
        resolve();
      }
    });
  }

  public changeAnnotationLevel(
    tiernum: number,
    level: OctraAnnotationAnyLevel<OctraAnnotationSegment>
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.annotationLevels !== undefined) {
        if (level !== undefined) {
          if (this.annotationLevels.length > tiernum) {
            waitTillResultRetrieved<Actions, Action, void>(
              this.actions,
              IDBActions.saveAnnotation.success,
              IDBActions.saveAnnotation.fail
            )
              .then(() => {
                resolve();
              })
              .catch((error) => {
                reject(error);
              });

            this.store.dispatch(
              AnnotationActions.changeAnnotationLevel.do({
                level,
                mode: this.useMode,
              })
            );
          } else {
            reject('number of level that should be changed is invalid');
          }
        } else {
          reject(new Error('level is undefined or undefined'));
        }
      } else {
        reject('annotation object is undefined or undefined');
      }
    });
  }

  public removeAnnotationLevel(id: number): Promise<void> {
    if (id > -1) {
      this.store.dispatch(
        AnnotationActions.removeAnnotationLevel.do({
          id,
          mode: this.useMode,
        })
      );
      return new Promise<void>((resolve) => {
        resolve();
      });
    } else {
      return new Promise<void>((resolve, reject2) => {
        reject2(new Error('level is undefined or undefined'));
      });
    }
  }

  public clearLoggingDataPermanently() {
    this.store.dispatch(
      AnnotationActions.clearLogs.do({
        mode: this.useMode,
      })
    );
  }

  public startOnlineAnnotation(project: ProjectDto) {
    this.store.dispatch(
      AnnotationActions.startNewAnnotation.do({
        project,
        mode: LoginMode.ONLINE,
      })
    );
  }

  public logout(clearSession = false) {
    this.store.dispatch(
      AuthenticationActions.logout.do({
        message: 'You were logged out',
        clearSession,
        mode: this.useMode,
      })
    );
  }

  public undo() {
    if (!this._undoRedoDisabled) {
      this.store.dispatch(ApplicationActions.undo());
    }
  }

  public disableUndoRedo() {
    this._undoRedoDisabled = true;
    this.clearHistory();
  }

  public enableUndoRedo() {
    if (this._undoRedoDisabled) {
      this.clearHistory();
      this._undoRedoDisabled = false;
    }
  }

  public redo() {
    if (!this._undoRedoDisabled) {
      this.store.dispatch(ApplicationActions.redo());
    }
  }

  public clearHistory() {
    this.store.dispatch(ApplicationActions.clear());
  }

  public clearAnnotationPermanently() {
    this.store.dispatch(
      AnnotationActions.clearAnnotation.do({
        mode: this.useMode,
      })
    );
  }

  public clearWholeSession(): Promise<void> {
    this.store.dispatch(IDBActions.clearAllData.do());

    return waitTillResultRetrieved<Actions, Action, void>(
      this.actions,
      IDBActions.clearAllData.success,
      IDBActions.clearAllData.fail
    );
  }

  public abortReAuthentication() {
    this.store.dispatch(AuthenticationActions.needReAuthentication.abort());
  }
}
