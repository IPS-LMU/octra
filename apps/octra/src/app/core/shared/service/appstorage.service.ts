import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorageService} from 'ngx-webstorage';
import {Observable, Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {IDataEntry} from '../../obj/data-entry';
import {SessionFile} from '../../obj/SessionFile';
import {FileProgress} from '../../obj/objects';
import {Functions, isUnset, SubscriptionManager} from '@octra/utilities';
import {Level, OIDBLevel, OIDBLink} from '@octra/annotation';
import {
  AnnotationState,
  AnnotationStateLevel,
  convertFromOIDLevel,
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
import {TranscriptionActions} from '../../store/transcription/transcription.actions';
import {ApplicationActions} from '../../store/application/application.actions';
import {LoginActions} from '../../store/login/login.actions';
import {IDBActions} from '../../store/idb/idb.actions';
import * as fromTranscriptionReducer from '../../store/transcription/transcription.reducer';
import * as fromAnnotation from '../../store/annotation';
import {ASRActions} from '../../store/asr/asr.actions';

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
    return this._snapshot.login.sessionFile;
  }

  set userProfile(value: { name: string; email: string }) {
    this.store.dispatch(UserActions.setUserProfile(value));
  }

  set playonhover(value: boolean) {
    this.store.dispatch(TranscriptionActions.setPlayOnHover({playOnHover: value}));
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
    this.store.dispatch(LoginActions.setServerDataEntry({serverDataEntry: value}));
  }

  set submitted(value: boolean) {
    this.store.dispatch(TranscriptionActions.setSubmitted({submitted: value}));
  }

  get feedback(): any {
    return this._snapshot.transcription.feedback;
  }

  set feedback(value: any) {
    this.store.dispatch(TranscriptionActions.setFeedback({feedback: value}));
  }

  get dataID(): number {
    return this._snapshot.login.onlineSession?.sessionData?.dataID;
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
    return this._snapshot.transcription.logging;
  }

  set logging(value: boolean) {
    this.store.dispatch(TranscriptionActions.setLogging({
      logging: value
    }));
  }

  get showLoupe(): boolean {
    return this._snapshot.transcription.showLoupe;
  }

  get consoleEntries(): ConsoleEntry[] {
    return this._snapshot.application.consoleEntries;
  }

  set consoleEntries(consoleEntries: ConsoleEntry[]) {
    this.store.dispatch(ApplicationActions.setConsoleEntries({
      consoleEntries
    }))
  }

  set showLoupe(value: boolean) {
    this.store.dispatch(TranscriptionActions.setShowLoupe({
      showLoupe: value
    }));
  }

  get prompttext(): string {
    return this._snapshot.login.onlineSession?.sessionData?.promptText;
  }

  get urlParams(): any {
    return this._snapshot.login.queryParams;
  }

  get easymode(): boolean {
    return this._snapshot.transcription.easyMode;
  }

  set easymode(value: boolean) {
    this.store.dispatch(TranscriptionActions.setEasyMode({
      easyMode: value
    }));
  }

  get comment(): string {
    return this._snapshot.login.onlineSession?.sessionData?.comment;
  }

  set comment(value: string) {
    this.store.dispatch(LoginActions.setComment({
      comment: value
    }));
  }

  get servercomment(): string {
    return this._snapshot.login.onlineSession?.sessionData?.serverComment;
  }

  get annotationLevels(): AnnotationStateLevel[] {
    return this._snapshot.annotation.levels;
  }

  get annotationLinks(): OIDBLink[] {
    return this._snapshot.annotation.links;
  }

  get secondsPerLine(): number {
    return this._snapshot.transcription.secondsPerLine;
  }

  set secondsPerLine(value: number) {
    this.store.dispatch(TranscriptionActions.setSecondsPerLine({
      secondsPerLine: value
    }));
    this.settingschange.next({
      key: 'secondsPerLine',
      value
    });
  }

  get highlightingEnabled(): boolean {
    return this._snapshot.transcription.highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this.store.dispatch(TranscriptionActions.setHighlightingEnabled({
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
        this.store.dispatch(TranscriptionActions.setTranscriptionState({
          ...fromTranscriptionReducer.initialState,
          playOnHover: this.sessStr.retrieve('playonhover'),
          followPlayCursor: this.sessStr.retrieve('followplaycursor')
        }));

        this.store.dispatch(LoginActions.setJobsLeft({jobsLeft: this.sessStr.retrieve('jobsLeft')}));

        this.store.dispatch(LoginActions.setLoggedIn({
          loggedIn: this.sessStr.retrieve('loggedIn')
        }));
        this.reloaded = this.sessStr.retrieve('reloaded');
        this.serverDataEntry = this.sessStr.retrieve('serverDataEntry');
      }
    }));
  }

  public saving: EventEmitter<string> = new EventEmitter<string>();
  public settingschange = new Subject<{ key: string, value: any }>();

  // is user on the login page?
  private login: boolean;

  private subscrManager = new SubscriptionManager();

  private _loaded = new EventEmitter();

  private _snapshot: RootState;

  set savingNeeded(value: boolean) {
    this.store.dispatch(TranscriptionActions.setSavingNeeded({savingNeeded: value}));
  }

  set followPlayCursor(value: boolean) {
    this.store.dispatch(TranscriptionActions.setFollowPlayCursor({
      followPlayCursor: value
    }));
  }

  get idbLoaded(): boolean {
    return this._snapshot.application.idb.loaded;
  }

  get followPlayCursor(): boolean {
    return this._snapshot.transcription.followPlayCursor;
  }

  get jobsLeft(): number {
    return this._snapshot.login.onlineSession?.sessionData.jobsLeft;
  }

  get logs(): any[] {
    return this._snapshot.transcription.logs;
  }

  get onlineSession(): OnlineSession {
    return this._snapshot.login.onlineSession;
  }

  get userProfile(): { name: string; email: string } {
    return this.snapshot.user;
  }

  get playonhover(): boolean {
    return this._snapshot.transcription.playOnHover;
  }

  get reloaded(): boolean {
    return this._snapshot.application.reloaded;
  }

  get serverDataEntry(): IDataEntry {
    return this._snapshot.login.onlineSession.sessionData?.serverDataEntry;
  }

  get submitted(): boolean {
    return this._snapshot.transcription.submitted;
  }

  setLogs(value: any[]) {
    this.store.dispatch(TranscriptionActions.setLogs({logs: value}));
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
    return this._snapshot.transcription.audio.loaded;
  }

  set audioLoaded(loaded: boolean) {
    this.store.dispatch(TranscriptionActions.setAudioLoaded({
      loaded
    }));
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
    return this._snapshot.transcription.audioSettings.volume;
  }

  public set audioVolume(value: number) {
    this.store.dispatch(TranscriptionActions.setAudioSettings({
      volume: value,
      speed: this.audioSpeed
    }));
  }

  public get audioSpeed(): number {
    return this._snapshot.transcription.audioSettings.speed;
  }

  public set audioSpeed(value: number) {
    this.store.dispatch(TranscriptionActions.setAudioSettings({
      speed: value,
      volume: this.audioVolume
    }));
  }

  get savingNeeded(): boolean {
    return this._snapshot.transcription.savingNeeded;
  }

  get isSaving(): boolean {
    return this._snapshot.transcription.isSaving;
  }

  set isSaving(value: boolean) {
    this.store.dispatch(TranscriptionActions.setIsSaving({isSaving: value}));
  }

  get audioURL(): string {
    return this._snapshot.login.onlineSession?.sessionData?.audioURL;
  }

  get useMode(): LoginMode {
    return this._snapshot.login.mode;
  }

  get loggedIn(): boolean {
    return this._snapshot.login.loggedIn;
  }

  get interface(): string {
    return this._snapshot.transcription.currentEditor;
  }

  set interface(newInterface: string) {
    this.store.dispatch(TranscriptionActions.setCurrentEditor({currentEditor: newInterface}));
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

        const onlineSession = this._snapshot.login.onlineSession;

        const loginLocal = () => {

          const storeFiles = files.map(a => (a.file));
          this.setLocalSession(storeFiles, this.getSessionFile(audiofile));
          resolve();
        };

        if (!isUnset(audiofile)) {
          if (!keepData || (!isUnset(onlineSession) && !isUnset(onlineSession.sessionData?.dataID))) {
            // last was online mode
            this.clearOnlineSession();
            this.clearLocalStorage();
            // TODO waiting?
            loginLocal();
          } else {
            loginLocal();
          }
        } else {
          reject('file not supported');
        }
      }
    });
  }

  public getSessionFile = (file: File) => {
    return new SessionFile(
      file.name,
      file.size,
      new Date(file.lastModified),
      file.type
    );
  }

  public overwriteAnnotation = (levels: OIDBLevel[], links: OIDBLink[], saveToDB = true): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      if (saveToDB) {
        let max = 0;

        for (const valueElem of levels) {
          max = Math.max(max, valueElem.id);
        }

        const subscr = this.actions.subscribe((a) => {
          if (a.type === IDBActions.overwriteAnnotationSuccess.type) {
            resolve();
            subscr.unsubscribe();
          } else if (a.type === IDBActions.overwriteAnnotationFailed.type) {
            reject((a as any).error);
            subscr.unsubscribe();
          }
        });

        this.store.dispatch(AnnotationActions.overwriteAnnotation({
          annotation: {
            levels: (levels.map((a) => {
              return convertFromOIDLevel(a);
            }) as AnnotationStateLevel[]),
            links,
            levelCounter: max
          },
          saveToDB
        }));
      }
    });
  }

  public overwriteLinks = (value: OIDBLink[]) => {
    this.store.dispatch(AnnotationActions.overwriteLinks({
      links: value
    }));
  }

  setOnlineSession(member: any, dataID: number, audioURL: string, promptText: string, serverComment: string, jobsLeft: number) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    if (!this.login && !isUnset(member)) {
      this.store.dispatch(LoginActions.loginOnline({
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
            comment: ''
          }
        }
      }));

      this.login = true;
    }
  }

  setLocalSession(files: File[], sessionFile: SessionFile) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(LoginActions.loginLocal({files, sessionFile}));
    this.login = true;
  }

  setDemoSession(audioURL: string, serverComment: string, jobsLeft: number) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(LoginActions.loginDemo({
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
          jobsLeft
        }
      }
    }));
    this.login = true;
  }

  setURLSession(audio: string, transcript: string, embedded: boolean, host: string) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(LoginActions.loginURLParameters({
      urlParams: {
        audio,
        transcript,
        embedded,
        host
      }
    }))
    this.login = true;
  }

  public clearOnlineSession(): boolean {
    this.login = false;
    this.store.dispatch(LoginActions.clearOnlineSession());

    this.sessStr.clear();
    return (isUnset(this.sessStr.retrieve('member_id')));
  }

  public clearLocalStorage() {
    this.login = false;
    this.store.dispatch(LoginActions.clearLocalSession());
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
          Functions.waitTillResultRetrieved(this.actions, IDBActions.saveTranscriptionFeedbackSuccess, IDBActions.saveTranscriptionFeedbackFailed)
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
          this.store.dispatch(TranscriptionActions.setFeedback({
            feedback: value
          }));

          break;
        default:
          return false; // if key not found return false
      }
    }
    return true;
  }

  public saveLogItem(log: any) {
    if (!isUnset(log)) {
      for (const attr in log) {
        if (log.hasOwnProperty(attr) && isUnset(log['' + attr])) {
          delete log['' + attr];
        }
      }

      this.store.dispatch(TranscriptionActions.addLog({
        log: log
      }));
    } else {
      console.error('Can\'t save log because it is null.');
    }
  }

  public endSession(): Promise<void> {
    return new Promise<void>((resolve) => {
      // TODO wait until cleaned!
      this.clearOnlineSession();
      this.clearLocalStorage();
      resolve();
    });
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

            Functions.waitTillResultRetrieved(this.actions, IDBActions.saveAnnotationLevelSuccess, IDBActions.saveAnnotationLevelFailed)
              .then(() => {
                resolve();
              })
              .catch((error) => {
                reject(error);
              });

            this.store.dispatch(AnnotationActions.changeAnnotationLevel({
              level,
              id,
              sortorder: tiernum
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
        level.id = ++Level.counter;

        Functions.waitTillResultRetrieved(this.actions, IDBActions.addAnnotationLevelSuccess, IDBActions.addAnnotationLevelFailed)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });

        this.store.dispatch(AnnotationActions.addAnnotationLevel({
          level: convertFromOIDLevel(level)
        }));
      } else {
        console.error('level is undefined or null');
      }
    });
  }

  public removeAnnotationLevel(id: number): Promise<void> {
    if (id > -1) {
      this.store.dispatch(AnnotationActions.removeAnnotationLevel({
        id
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
    this.store.dispatch(TranscriptionActions.clearLogs());
  }

  public getLevelByID(id: number) {
    for (const level of this.annotationLevels) {
      if (level.id === id) {
        return level;
      }
    }
    return null;
  }

  public logout() {
    this.endSession().then(() => {
      this.clearHistory();
      this.store.dispatch(LoginActions.logout());
      Functions.navigateTo(this.router, ['login'], AppInfo.queryParamsHandling).catch((error) => {
        console.error(error);
      });
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
    this.store.dispatch(AnnotationActions.clearAnnotation());
  }
}
