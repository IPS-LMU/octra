import { EventEmitter, Injectable } from '@angular/core';
import { SessionStorageService } from 'ngx-webstorage';
import { AppInfo } from '../../../app.info';
import { SessionFile } from '../../obj/SessionFile';
import { FileProgress } from '../../obj/objects';
import {
  getProperties,
  SubscriptionManager,
  waitTillResultRetrieved,
} from '@octra/utilities';
import { OIDBLevel, OIDBLink } from '@octra/annotation';
import { getModeState, LoadingStatus, LoginMode, RootState } from '../../store';
import { Action, Store } from '@ngrx/store';
import { AudioManager } from '@octra/media';
import { Actions } from '@ngrx/effects';
import { ConsoleEntry } from './bug-report.service';
import { Router } from '@angular/router';
import { AnnotationActions } from '../../store/annotation/annotation.actions';
import { ApplicationActions } from '../../store/application/application.actions';
import { IDBActions } from '../../store/idb/idb.actions';
import * as fromAnnotation from '../../store/annotation';
import {
  AnnotationState,
  AnnotationStateLevel,
  convertFromOIDLevel,
  OnlineSession,
} from '../../store/annotation';
import { ASRActions } from '../../store/asr/asr.actions';
import { ILog } from '../../obj/Settings/logging';
import { OnlineModeActions } from '../../store/modes/online-mode/online-mode.actions';
import { LocalModeActions } from '../../store/modes/local-mode/local-mode.actions';
import { Observable, Subject, Subscription } from 'rxjs';
import { ProjectDto } from '@octra/api-types';
import { AuthenticationActions } from '../../store/authentication';

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
    return this._snapshot.localMode.sessionFile;
  }

  get playonhover(): boolean {
    return this._snapshot.application.options.playOnHover;
  }

  set playonhover(value: boolean) {
    this.store.dispatch(
      ApplicationActions.setPlayOnHover({ playOnHover: value })
    );
  }

  public get annotationChanged(): Observable<AnnotationState> {
    const subject = new Subject<AnnotationState>();
    this.store.select(fromAnnotation.selectAnnotation).subscribe((state) => {
      console.log(`annotation changed`);
      subject.next(state);
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

  get serverDataEntry(): any {
    return getModeState(this._snapshot)?.onlineSession.sessionData
      ?.serverDataEntry;
  }

  set serverDataEntry(value: any) {
    this.store.dispatch(
      OnlineModeActions.setServerDataEntry({
        serverDataEntry: value,
        mode: this.useMode,
      })
    );
  }

  get submitted(): boolean {
    console.log(`mode state for ${this.useMode}`);
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.submitted;
  }

  set submitted(value: boolean) {
    this.store.dispatch(
      OnlineModeActions.setSubmitted({
        submitted: value,
        mode: this._snapshot.application.mode,
      })
    );
  }

  get feedback(): any {
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.feedback;
  }

  set feedback(value: any) {
    this.store.dispatch(
      OnlineModeActions.setFeedback({
        feedback: value,
        mode: this.useMode,
      })
    );
  }

  get transcriptID(): number {
    return getModeState(this._snapshot)?.onlineSession?.sessionData
      ?.transcriptID;
  }

  get language(): string {
    return this._snapshot.application.language;
  }

  set language(value: string) {
    this.store.dispatch(ApplicationActions.setAppLanguage({ language: value }));
  }

  /* Getter/Setter IDB Storage */
  get dbVersion(): number {
    return this._snapshot.application.idb.version;
  }

  get logging(): boolean {
    return getModeState(this._snapshot)?.logging;
  }

  set logging(value: boolean) {
    this.store.dispatch(
      AnnotationActions.setLogging.do({
        logging: value,
        mode: this.useMode,
      })
    );
  }

  get showLoupe(): boolean {
    return this._snapshot.application.options.showLoupe;
  }

  set showLoupe(value: boolean) {
    this.store.dispatch(
      ApplicationActions.setShowLoupe({
        showLoupe: value,
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

  get prompttext(): string {
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.promptText;
  }

  get urlParams(): any {
    return this._snapshot.application.queryParams;
  }

  get easymode(): boolean {
    return this._snapshot.application.options.easyMode;
  }

  set easymode(value: boolean) {
    this.store.dispatch(
      ApplicationActions.setEasyMode({
        easyMode: value,
      })
    );
  }

  get comment(): string {
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.comment;
  }

  set comment(value: string) {
    this.store.dispatch(
      OnlineModeActions.setComment({
        comment: value,
        mode: this.useMode,
      })
    );
  }

  get servercomment(): string {
    return getModeState(this._snapshot)?.onlineSession?.sessionData
      ?.serverComment;
  }

  get annotationLevels(): AnnotationStateLevel[] {
    return getModeState(this._snapshot)?.transcript?.levels;
  }

  get annotationLinks(): OIDBLink[] {
    return getModeState(this._snapshot)?.transcript?.links;
  }

  get secondsPerLine(): number {
    return this._snapshot.application.options.secondsPerLine;
  }

  set secondsPerLine(value: number) {
    this.store.dispatch(
      ApplicationActions.setSecondsPerLine({
        secondsPerLine: value,
      })
    );
    this.settingschange.next({
      key: 'secondsPerLine',
      value,
    });
  }

  get loadingStatus(): LoadingStatus {
    return this._snapshot?.application?.loading?.status;
  }

  get highlightingEnabled(): boolean {
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

  constructor(
    public sessStr: SessionStorageService,
    private store: Store<RootState>,
    private actions: Actions,
    private router: Router
  ) {
    this.subscrManager.add(
      this.store.subscribe((state: RootState) => {
        this._snapshot = state;
      })
    );
  }

  public saving: EventEmitter<string> = new EventEmitter<string>();
  public settingschange = new Subject<{ key: string; value: any }>();

  private subscrManager = new SubscriptionManager<Subscription>();

  private _loaded = new EventEmitter();

  private _snapshot: RootState;

  get savingNeeded(): boolean {
    return getModeState(this._snapshot).savingNeeded;
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
      ApplicationActions.setFollowPlayCursor({
        followPlayCursor: value,
      })
    );
  }

  get followPlayCursor(): boolean {
    return this._snapshot.application.options.followPlayCursor;
  }

  get idbLoaded(): boolean {
    return this._snapshot.application.idb.loaded;
  }

  get jobsLeft(): number {
    return getModeState(this._snapshot)?.onlineSession?.currentProject
      ?.jobsLeft;
  }

  set jobsLeft(jobsLeft: number) {
    this.store.dispatch(
      ApplicationActions.setJobsLeft({
        jobsLeft,
      })
    );
  }

  get logs(): any[] {
    return getModeState(this._snapshot)?.logs;
  }

  get onlineSession(): OnlineSession {
    return getModeState(this._snapshot)?.onlineSession;
  }

  get asrSelectedLanguage(): string {
    return this._snapshot.asr.selectedLanguage;
  }

  set asrSelectedLanguage(value: string) {
    this.store.dispatch(
      ASRActions.setASRSettings({
        selectedLanguage: value,
        selectedService: this.asrSelectedService,
      })
    );
  }

  get audioLoaded() {
    const modeState = getModeState(this._snapshot);
    if (modeState) {
      return modeState.audio.loaded;
    }
    return undefined;
  }

  get asrSelectedService(): string {
    return this._snapshot.asr.selectedService;
  }

  set asrSelectedService(value: string) {
    this.store.dispatch(
      ASRActions.setASRSettings({
        selectedLanguage: this.asrSelectedLanguage,
        selectedService: value,
      })
    );
  }

  public get audioVolume(): number {
    return this._snapshot?.application?.options?.audioSettings?.volume;
  }

  public set audioVolume(value: number) {
    this.store.dispatch(
      ApplicationActions.setAudioSettings({
        volume: value,
        speed: this.audioSpeed,
      })
    );
  }

  public get audioSpeed(): number {
    return this._snapshot.application?.options?.audioSettings?.speed;
  }

  public set audioSpeed(value: number) {
    this.store.dispatch(
      ApplicationActions.setAudioSettings({
        speed: value,
        volume: this.audioVolume,
      })
    );
  }

  get isSaving(): boolean {
    return getModeState(this._snapshot).isSaving;
  }

  set isSaving(value: boolean) {
    this.store.dispatch(
      AnnotationActions.setIsSaving.do({
        isSaving: value,
      })
    );
  }

  get audioURL(): string {
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.audioURL;
  }

  get useMode(): LoginMode {
    return this._snapshot.application.mode;
  }

  get loggedIn(): boolean {
    return this._snapshot.application.loggedIn;
  }

  set loggedIn(loggedIn: boolean) {
    this.store.dispatch(
      ApplicationActions.setLoggedIn({
        loggedIn,
      })
    );
  }

  get interface(): string {
    return getModeState(this._snapshot)?.currentEditor;
  }

  set interface(newInterface: string) {
    this.store.dispatch(
      AnnotationActions.setCurrentEditor.do({
        currentEditor: newInterface,
        mode: this.useMode,
      })
    );
  }

  public beginLocalSession = async (
    files: FileProgress[],
    keepData: boolean
  ) => {
    return new Promise<void>((resolve, reject) => {
      if (files !== undefined) {
        // get audio file
        let audiofile;
        for (const file of files) {
          if (
            AudioManager.isValidAudioFileName(
              file.file.name,
              AppInfo.audioformats
            )
          ) {
            audiofile = file.file;
            break;
          }
        }

        if (audiofile !== undefined) {
          const storeFiles = files.map((a) => a.file);
          this.setLocalSession(storeFiles, this.getSessionFile(audiofile));
          resolve();
        } else {
          reject('file not supported');
        }
      }
    });
  };

  public getSessionFile = (file: File) => {
    return new SessionFile(
      file.name,
      file.size,
      new Date(file.lastModified),
      file.type
    );
  };

  public overwriteAnnotation = (
    levels: OIDBLevel[],
    links: OIDBLink[],
    saveToDB = true
  ) => {
    let max = 0;

    for (const valueElem of levels) {
      max = Math.max(max, valueElem.id);
    }

    this.store.dispatch(
      AnnotationActions.overwriteTranscript.do({
        mode: this.useMode,
        transcript: {
          levels: levels.map((a) => {
            return convertFromOIDLevel(a.level, a.id);
          }),
          links,
          levelCounter: max,
        },
        saveToDB,
      })
    );
  };

  public overwriteLinks = (value: OIDBLink[]) => {
    this.store.dispatch(
      AnnotationActions.overwriteLinks.do({
        links: value,
      })
    );
  };

  setLocalSession(files: File[], sessionFile: SessionFile) {
    if (this.easymode === undefined) {
      this.easymode = false;
    }

    if (this.interface === undefined) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(
      LocalModeActions.login({
        files,
        sessionFile,
        removeData: false,
        mode: LoginMode.LOCAL,
      })
    );
  }

  setDemoSession(audioURL: string, serverComment: string, jobsLeft: number) {
    if (this.easymode === undefined) {
      this.easymode = false;
    }

    if (this.interface === undefined) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(
      OnlineModeActions.loginDemo({
        mode: LoginMode.DEMO,
        onlineSession: {
          currentProject: {
            id: '234267',
            name: 'DemoProject',
            description: 'This is a demo project.',
            creationdate: new Date().toISOString(),
            updatedate: new Date().toISOString(),
            active: true,
            visibility: 'public',
            roles: [],
          },
        },
      })
    );
  }

  setURLSession(
    audio: string,
    transcript: string,
    embedded: boolean,
    host: string
  ) {
    if (this.easymode === undefined) {
      this.easymode = false;
    }

    if (this.interface === undefined) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(
      OnlineModeActions.loginURLParameters({
        urlParams: {
          audio,
          transcript,
          embedded,
          host,
        },
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
            IDBActions.saveTranscriptionFeedbackSuccess,
            IDBActions.saveTranscriptionFeedbackFailed
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
            OnlineModeActions.setFeedback({
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

  public saveLogItem(log: ILog) {
    if (log !== undefined) {
      const properties = getProperties(log);
      for (const [name, value] of properties) {
        if (value === undefined) {
          delete log['' + name];
        }
      }

      this.store.dispatch(
        AnnotationActions.addLog.do({
          mode: this.useMode,
          log: log,
        })
      );
    } else {
      console.error("Can't save log because it is undefined.");
    }
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
    level: AnnotationStateLevel
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.annotationLevels !== undefined) {
        if (level !== undefined) {
          if (this.annotationLevels.length > tiernum) {
            waitTillResultRetrieved<Actions, Action, void>(
              this.actions,
              IDBActions.saveAnnotationSuccess,
              IDBActions.saveAnnotationFailed
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

  public addAnnotationLevel(level: OIDBLevel) {
    return new Promise<void>((resolve, reject) => {
      if (level !== undefined) {
        level.id = getModeState(this._snapshot).transcript.levelCounter + 1;

        waitTillResultRetrieved<Actions, Action, void>(
          this.actions,
          IDBActions.addAnnotationLevelSuccess,
          IDBActions.addAnnotationLevelFailed
        )
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });

        this.store.dispatch(
          AnnotationActions.addAnnotationLevel.do({
            level: convertFromOIDLevel(level.level, level.id),
            mode: this.useMode,
          })
        );
      } else {
        console.error('level is undefined or undefined');
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

  public getLevelByID(id: number) {
    for (const level of this.annotationLevels) {
      if (level.id === id) {
        return level;
      }
    }
    return undefined;
  }

  public startOnlineAnnotation(project: ProjectDto) {
    this.store.dispatch(
      AnnotationActions.startAnnotation.do({
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

  public clearWholeSession(): Promise<void[]> {
    const promises: Promise<void>[] = [];
    promises.push(
      waitTillResultRetrieved<Actions, Action, void>(
        this.actions,
        IDBActions.clearAllOptionsSuccess,
        IDBActions.clearAllOptionsFailed
      ),
      waitTillResultRetrieved<Actions, Action, void>(
        this.actions,
        IDBActions.clearLogsSuccess,
        IDBActions.clearLogsFailed
      ),
      waitTillResultRetrieved<Actions, Action, void>(
        this.actions,
        IDBActions.clearAnnotationSuccess,
        IDBActions.clearAnnotationFailed
      )
    );
    this.store.dispatch(
      AnnotationActions.clearWholeSession.success({
        mode: this.useMode,
      })
    );

    return Promise.all(promises);
  }
}
