import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorageService} from 'ngx-webstorage';
import {Observable, Subject, Subscription} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {IDataEntry} from '../../obj/data-entry';
import {SessionFile} from '../../obj/SessionFile';
import {FileProgress} from '../../obj/objects';
import {isUnset, navigateTo, SubscriptionManager, waitTillResultRetrieved} from '@octra/utilities';
import {OIDBLevel, OIDBLink} from '@octra/annotation';
import {
  AnnotationState,
  AnnotationStateLevel,
  convertFromOIDLevel,
  getModeState,
  LoadingStatus,
  LoginMode,
  OnlineSession,
  RootState
} from '../../store';
import {Store} from '@ngrx/store';
import {AudioManager} from '@octra/media';
import {Actions} from '@ngrx/effects';
import {ConsoleEntry} from './bug-report.service';
import {Router} from '@angular/router';
import {AnnotationActions} from '../../store/annotation/annotation.actions';
import {UserActions} from '../../store/user/user.actions';
import {ApplicationActions} from '../../store/application/application.actions';
import {IDBActions} from '../../store/idb/idb.actions';
import * as fromAnnotation from '../../store/annotation';
import {ASRActions} from '../../store/asr/asr.actions';
import {ILog} from '../../obj/Settings/logging';
import {OnlineModeActions} from '../../store/modes/online-mode/online-mode.actions';
import {LocalModeActions} from '../../store/modes/local-mode/local-mode.actions';

@Injectable({
  providedIn: 'root'
})
export class AppStorageService {
  get undoRedoDisabled(): boolean {
    return this._undoRedoDisabled;
  }

  get snapshot(): RootState {
    return this._snapshot;
  }

  get loaded(): EventEmitter<any> {
    return this._loaded;
  }

  get sessionfile(): SessionFile {
    return this._snapshot.localMode.sessionFile;
  }

  set userProfile(value: { name: string; email: string }) {
    this.store.dispatch(UserActions.setUserProfile(value));
  }

  set playonhover(value: boolean) {
    this.store.dispatch(ApplicationActions.setPlayOnHover({playOnHover: value}));
  }

  public get annotationChanged(): Observable<AnnotationState> {
    const subject = new Subject<AnnotationState>();
    this.store.select(fromAnnotation.selectAnnotation).subscribe((state) => {
      subject.next(state);
    });
    return subject;
  }

  set reloaded(value: boolean) {
    this.store.dispatch(ApplicationActions.setReloaded({
      reloaded: value
    }));
  }

  set serverDataEntry(value: IDataEntry) {
    this.store.dispatch(OnlineModeActions.setServerDataEntry({serverDataEntry: value}));
  }

  set submitted(value: boolean) {
    this.store.dispatch(OnlineModeActions.setSubmitted({
      submitted: value,
      mode: this._snapshot.application.mode
    }));
  }

  get feedback(): any {
    return getModeState(this._snapshot)?.onlineSession?.feedback;
  }

  set feedback(value: any) {
    this.store.dispatch(OnlineModeActions.setFeedback(
      {
        feedback: value,
        mode: this.useMode
      }));
  }

  get dataID(): number {
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.dataID;
  }

  get language(): string {
    return this._snapshot.application.language;
  }

  set language(value: string) {
    this.store.dispatch(ApplicationActions.setAppLanguage({language: value}));
  }

  /* Getter/Setter IDB Storage */
  get dbVersion(): number {
    return this._snapshot.application.idb.version;
  }

  get logging(): boolean {
    return getModeState(this._snapshot)?.logging;
  }

  set logging(value: boolean) {
    this.store.dispatch(AnnotationActions.setLogging({
      logging: value,
      mode: this.useMode
    }));
  }

  get showLoupe(): boolean {
    return this._snapshot.application.options.showLoupe;
  }

  get consoleEntries(): ConsoleEntry[] {
    return this._snapshot.application.consoleEntries;
  }

  set consoleEntries(consoleEntries: ConsoleEntry[]) {
    this.store.dispatch(ApplicationActions.setConsoleEntries({
      consoleEntries
    }));
  }

  set showLoupe(value: boolean) {
    this.store.dispatch(ApplicationActions.setShowLoupe({
      showLoupe: value
    }));
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
    this.store.dispatch(ApplicationActions.setEasyMode({
      easyMode: value
    }));
  }

  get comment(): string {
    return getModeState(this._snapshot)?.onlineSession?.sessionData?.comment;
  }

  set comment(value: string) {
    this.store.dispatch(OnlineModeActions.setComment({
      comment: value,
      mode: this.useMode
    }));
  }

  get servercomment(): string {
    return getModeState(this._snapshot).onlineSession?.sessionData?.serverComment;
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

  get loadingStatus(): LoadingStatus {
    return this._snapshot?.application?.loading?.status;
  }

  set secondsPerLine(value: number) {
    this.store.dispatch(ApplicationActions.setSecondsPerLine({
      secondsPerLine: value
    }));
    this.settingschange.next({
      key: 'secondsPerLine',
      value
    });
  }

  get highlightingEnabled(): boolean {
    return this._snapshot.application?.options.highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this.store.dispatch(ApplicationActions.setHighlightingEnabled({
      highlightingEnabled: value
    }));
  }

  private _undoRedoDisabled = false;

  constructor(public sessStr: SessionStorageService,
              public localStr: LocalStorageService,
              private store: Store<RootState>,
              private actions: Actions,
              private router: Router) {
    this.subscrManager.add(this.store.subscribe((state: RootState) => {
      this._snapshot = state;
    }));

    this.subscrManager.add(actions.subscribe((action) => {
      if (action.type === '@ngrx/effects/init') {
        this.playonhover = this.sessStr.retrieve('playonhover');
        this.followPlayCursor = this.sessStr.retrieve('followplaycursor');
        this.jobsLeft = this.sessStr.retrieve('jobsLeft');
        this.loggedIn = this.sessStr.retrieve('loggedIn');
        this.reloaded = this.sessStr.retrieve('reloaded');
        this.serverDataEntry = this.sessStr.retrieve('serverDataEntry');
      }
    }));
  }

  public saving: EventEmitter<string> = new EventEmitter<string>();
  public settingschange = new Subject<{ key: string, value: any }>();

  private subscrManager = new SubscriptionManager<Subscription>();

  private _loaded = new EventEmitter();

  private _snapshot: RootState;

  set savingNeeded(value: boolean) {
    this.store.dispatch(AnnotationActions.setSavingNeeded({
      savingNeeded: value,
      mode: this.useMode
    }));
  }

  set followPlayCursor(value: boolean) {
    this.store.dispatch(ApplicationActions.setFollowPlayCursor({
      followPlayCursor: value
    }));
  }

  get idbLoaded(): boolean {
    return this._snapshot.application.idb.loaded;
  }

  get followPlayCursor(): boolean {
    return this._snapshot.application.options.followPlayCursor;
  }

  get jobsLeft(): number {
    return getModeState(this._snapshot)?.onlineSession?.sessionData.jobsLeft;
  }

  set jobsLeft(jobsLeft: number) {
    this.store.dispatch(ApplicationActions.setJobsLeft({
      jobsLeft
    }));
  }

  get logs(): any[] {
    return getModeState(this._snapshot)?.logs;
  }

  get onlineSession(): OnlineSession {
    return getModeState(this._snapshot)?.onlineSession;
  }

  get userProfile(): { name: string; email: string } {
    return this.snapshot.user;
  }

  get playonhover(): boolean {
    return this._snapshot.application.options.playOnHover;
  }

  get reloaded(): boolean {
    return this._snapshot.application.reloaded;
  }

  get serverDataEntry(): IDataEntry {
    return getModeState(this._snapshot)?.onlineSession.sessionData?.serverDataEntry;
  }

  get submitted(): boolean {
    return getModeState(this._snapshot)?.onlineSession?.submitted;
  }

  setLogs(value: any[]) {
    this.store.dispatch(AnnotationActions.saveLogs({
      logs: value,
      mode: this.useMode
    }));
  }

  get asrSelectedLanguage(): string {
    return this._snapshot.asr.selectedLanguage;
  }

  set asrSelectedLanguage(value: string) {
    this.store.dispatch(ASRActions.setASRSettings({
      selectedLanguage: value,
      selectedService: this.asrSelectedService
    }));
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
    this.store.dispatch(ASRActions.setASRSettings({
      selectedLanguage: this.asrSelectedLanguage,
      selectedService: value
    }));
  }

  public get audioVolume(): number {
    return this._snapshot?.application?.options?.audioSettings?.volume;
  }

  public set audioVolume(value: number) {
    this.store.dispatch(ApplicationActions.setAudioSettings({
      volume: value,
      speed: this.audioSpeed
    }));
  }

  public get audioSpeed(): number {
    return this._snapshot.application?.options?.audioSettings?.speed;
  }

  public set audioSpeed(value: number) {
    this.store.dispatch(ApplicationActions.setAudioSettings({
      speed: value,
      volume: this.audioVolume
    }));
  }

  get savingNeeded(): boolean {
    return getModeState(this._snapshot).savingNeeded;
  }

  get isSaving(): boolean {
    return getModeState(this._snapshot).isSaving;
  }

  set isSaving(value: boolean) {
    this.store.dispatch(AnnotationActions.setIsSaving({
      isSaving: value
    }));
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
    this.store.dispatch(ApplicationActions.setLoggedIn({
      loggedIn
    }));
  }

  get interface(): string {
    return getModeState(this._snapshot)?.currentEditor;
  }

  set interface(newInterface: string) {
    this.store.dispatch(AnnotationActions.setCurrentEditor({
      currentEditor: newInterface,
      mode: this.useMode
    }));
  }

  public beginLocalSession = async (files: FileProgress[], keepData: boolean) => {
    return new Promise<void>(async (resolve, reject) => {
      if (!isUnset(files)) {
        // get audio file
        let audiofile;
        for (const file of files) {
          if (AudioManager.isValidAudioFileName(file.file.name, AppInfo.audioformats)) {
            audiofile = file.file;
            break;
          }
        }


        if (!isUnset(audiofile)) {
          const storeFiles = files.map(a => (a.file));
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

  public overwriteAnnotation = (levels: OIDBLevel[], links: OIDBLink[], saveToDB = true): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      if (saveToDB) {
        let max = 0;

        for (const valueElem of levels) {
          max = Math.max(max, valueElem.id);
        }

        const subscr = this.actions.subscribe((a) => {
          if (a.type === IDBActions.overwriteAnnotationSuccess.type) {
            resolve(null);
            subscr.unsubscribe();
          } else if (a.type === IDBActions.overwriteAnnotationFailed.type) {
            reject((a as any).error);
            subscr.unsubscribe();
          }
        });

        this.store.dispatch(AnnotationActions.overwriteTranscript({
          mode: this.useMode,
          annotation: {
            levels: (levels.map((a) => {
              return convertFromOIDLevel(a.level, a.id);
            })),
            links,
            levelCounter: max
          },
          saveToDB
        }));
      }
    });
  };

  public overwriteLinks = (value: OIDBLink[]) => {
    this.store.dispatch(AnnotationActions.overwriteLinks({
      links: value
    }));
  };

  setOnlineSession(member: any, dataID: number, audioURL: string, promptText: string, serverComment: string, jobsLeft: number, removeData: boolean) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    if (!isUnset(member)) {
      this.store.dispatch(OnlineModeActions.login({
        mode: LoginMode.ONLINE,
        onlineSession: {
          loginData: {
            id: member.id,
            project: member.project,
            jobNumber: member.jobno,
            password: member.password
          },
          sessionData: {
            dataID,
            audioURL,
            promptText,
            serverComment,
            jobsLeft,
            serverDataEntry: null,
            comment: '',
            submitted: false,
            feedback: null
          }
        },
        removeData: false
      }));
    }
  }

  setLocalSession(files: File[], sessionFile: SessionFile) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(LocalModeActions.login({files, sessionFile, removeData: false, mode: LoginMode.LOCAL}));
  }

  setDemoSession(audioURL: string, serverComment: string, jobsLeft: number) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(OnlineModeActions.loginDemo({
      mode: LoginMode.DEMO,
      onlineSession: {
        loginData: {
          id: 'demo_user',
          project: 'demo',
          jobNumber: -1,
          password: ''
        },
        sessionData: {
          dataID: 21343134,
          promptText: '',
          serverDataEntry: null,
          comment: '',
          audioURL,
          serverComment,
          jobsLeft,
          submitted: false,
          feedback: null
        }
      }
    }));
  }

  setURLSession(audio: string, transcript: string, embedded: boolean, host: string) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(OnlineModeActions.loginURLParameters({
      urlParams: {
        audio,
        transcript,
        embedded,
        host
      }
    }));
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
          this.changeAnnotationLevel(value.num, value.level).then(
            () => {
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('success');
            }
          ).catch((err) => {
            this.isSaving = false;
            this.savingNeeded = false;
            this.saving.emit('error');
            console.error(`error on saving`);
            console.error(err);
          });
          break;
        case 'feedback':
          waitTillResultRetrieved(this.actions, IDBActions.saveTranscriptionFeedbackSuccess, IDBActions.saveTranscriptionFeedbackFailed)
            .then(() => {
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('success');
            }).catch((error) => {
            console.error(error);
            this.isSaving = false;
            this.savingNeeded = false;
            this.saving.emit('success');
          });
          this.store.dispatch(OnlineModeActions.setFeedback({
            mode: LoginMode.ONLINE,
            feedback: value
          }));

          break;
        default:
          return false; // if key not found return false
      }
    }
    return true;
  }

  public saveLogItem(log: ILog) {
    if (!isUnset(log)) {
      for (const attr in log) {
        if (log.hasOwnProperty(attr) && isUnset(log['' + attr])) {
          delete log['' + attr];
        }
      }

      this.store.dispatch(AnnotationActions.addLog({
        mode: this.useMode,
        log: log
      }));
    } else {
      console.error('Can\'t save log because it is null.');
    }
  }

  public afterSaving(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      if (this.isSaving || this.savingNeeded) {
        const subscr = this.saving.subscribe(() => {
          subscr.unsubscribe();
          resolve();
        }, (err) => {
          subscr.unsubscribe();
          reject(err);
        });
      } else {
        resolve();
      }
    });
  }

  public changeAnnotationLevel(tiernum: number, level: AnnotationStateLevel): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!isUnset(this.annotationLevels)) {
        if (!isUnset(level)) {
          if (this.annotationLevels.length > tiernum) {
            const changedLevel = this.annotationLevels[tiernum];
            const id = changedLevel.id;

            waitTillResultRetrieved(this.actions, IDBActions.saveAnnotationSuccess, IDBActions.saveAnnotationFailed)
              .then(() => {
                resolve();
              })
              .catch((error) => {
                reject(error);
              });

            this.store.dispatch(AnnotationActions.changeAnnotationLevel({
              level,
              mode: this.useMode
            }));
          } else {
            reject('number of level that should be changed is invalid');
          }
        } else {
          reject(new Error('level is undefined or null'));
        }
      } else {
        reject('annotation object is undefined or null');
      }
    });
  }

  public addAnnotationLevel(level: OIDBLevel) {
    return new Promise<void>((resolve, reject) => {
      if (!isUnset(level)) {
        level.id = getModeState(this._snapshot).transcript.levelCounter + 1;

        waitTillResultRetrieved(this.actions, IDBActions.addAnnotationLevelSuccess, IDBActions.addAnnotationLevelFailed)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });

        this.store.dispatch(AnnotationActions.addAnnotationLevel({
          level: convertFromOIDLevel(level.level, level.id),
          mode: this.useMode
        }));
      } else {
        console.error('level is undefined or null');
      }
    });
  }

  public removeAnnotationLevel(id: number): Promise<void> {
    if (id > -1) {
      this.store.dispatch(AnnotationActions.removeAnnotationLevel({
        id,
        mode: this.useMode
      }));
      return new Promise<void>((resolve) => {
        resolve();
      });
    } else {
      return new Promise<void>((resolve, reject2) => {
        reject2(new Error('level is undefined or null'));
      });
    }
  }

  public clearLoggingDataPermanently() {
    this.store.dispatch(AnnotationActions.clearLogs({
      mode: this.useMode
    }));
  }

  public getLevelByID(id: number) {
    for (const level of this.annotationLevels) {
      if (level.id === id) {
        return level;
      }
    }
    return null;
  }

  public logout(clearSession = false) {
    this.store.dispatch(AnnotationActions.logout({
      clearSession,
      mode: this.useMode
    }));
    // TODO WAIT?
    navigateTo(this.router, ['login'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
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
    this.store.dispatch(AnnotationActions.clearAnnotation({
      mode: this.useMode
    }));
  }

  public clearWholeSession(): Promise<void[]> {
    const promises: Promise<void>[] = [];
    promises.push(
      waitTillResultRetrieved(this.actions, IDBActions.clearAllOptionsSuccess, IDBActions.clearAllOptionsFailed),
      waitTillResultRetrieved(this.actions, IDBActions.clearLogsSuccess, IDBActions.clearLogsFailed),
      waitTillResultRetrieved(this.actions, IDBActions.clearAnnotationSuccess, IDBActions.clearAnnotationFailed)
    );
    this.store.dispatch(AnnotationActions.clearWholeSession({
      mode: this.useMode
    }));

    return Promise.all(promises);
  }
}
