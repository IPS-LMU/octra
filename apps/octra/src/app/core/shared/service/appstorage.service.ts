import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorageService} from 'ngx-webstorage';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {IDataEntry} from '../../obj/data-entry';
import {SessionFile} from '../../obj/SessionFile';
import {FileProgress} from '../../obj/objects';
import {isUnset, SubscriptionManager} from '@octra/utilities';
import {OIDBLevel, OIDBLink, OLevel} from '@octra/annotation';
import {LoginMode, OnlineSession, RootState} from '../../store';
import {Store} from '@ngrx/store';
import {AudioManager} from '@octra/media';
import * as fromApplicationActions from '../../store/application/application.actions';
import * as fromLoginActions from '../../store/login/login.actions';
import * as fromASRActions from '../../store/asr/asr.actions';
import * as fromTranscriptionActions from '../../store/transcription/transcription.actions';
import * as fromTranscriptionReducer from '../../store/transcription/transcription.reducer';
import * as fromUserActions from '../../store/user/user.actions';
import * as fromIDBActions from '../../store/idb/idb.actions'
import {Actions} from '@ngrx/effects';
import {ConsoleEntry} from './bug-report.service';

@Injectable()
export class AppStorageService {
  get snapshot(): RootState {
    return this._snapshot;
  }

  set snapshot(value: RootState) {
    this._snapshot = value;
  }

  get loaded(): EventEmitter<any> {
    return this._loaded;
  }

  get sessionfile(): SessionFile {
    return this._snapshot.login.sessionFile;
  }

  set userProfile(value: { name: string; email: string }) {
    this.store.dispatch(fromUserActions.setUserProfile(value));
  }

  set playonhover(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setPlayOnHover({playOnHover: value}));
  }

  set reloaded(value: boolean) {
    this.store.dispatch(fromApplicationActions.setReloaded({
      reloaded: value
    }));
  }

  set serverDataEntry(value: IDataEntry) {
    this.store.dispatch(fromLoginActions.setServerDataEntry({serverDataEntry: value}));
  }

  set submitted(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setSubmitted({submitted: value}));
  }

  get feedback(): any {
    return this._snapshot.transcription.feedback;
  }

  set feedback(value: any) {
    this.store.dispatch(fromTranscriptionActions.setFeedback({feedback: value}));
  }

  get dataID(): number {
    return this._snapshot.login.onlineSession?.dataID;
  }

  get language(): string {
    return this._snapshot.application.language;
  }

  set language(value: string) {
    this.store.dispatch(fromApplicationActions.setAppLanguage({language: value}));
  }

  /* Getter/Setter IDB Storage */
  get version(): string {
    return this._snapshot.application.version;
  }

  set version(value: string) {
    this.store.dispatch(fromApplicationActions.setAppVersion({version: value}));
  }

  get logging(): boolean {
    return this._snapshot.transcription.logging;
  }

  set logging(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setLogging({
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
    this.store.dispatch(fromApplicationActions.setConsoleEntries({
      consoleEntries
    }))
  }

  set showLoupe(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setShowLoupe({
      showLoupe: value
    }));
  }

  get prompttext(): string {
    return this._snapshot.login.onlineSession?.promptText;
  }

  get urlParams(): any {
    return this._snapshot.login.queryParams;
  }

  get easymode(): boolean {
    return this._snapshot.transcription.easyMode;
  }

  set easymode(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setEasyMode({
      easyMode: value
    }));
  }

  get comment(): string {
    return this._snapshot.login.onlineSession?.comment;
  }

  set comment(value: string) {
    this.store.dispatch(fromLoginActions.setComment({
      comment: value
    }));
  }

  get servercomment(): string {
    return this._snapshot.login.onlineSession?.serverComment;
  }

  get annotationLevels(): OIDBLevel[] {
    return this._snapshot.transcription.annotation.levels;
  }

  get annotationLinks(): OIDBLink[] {
    return this._snapshot.transcription.annotation.links;
  }

  get levelcounter(): number {
    return this._snapshot.transcription.annotation.levelCounter;
  }

  set levelcounter(value: number) {
    this.store.dispatch(fromTranscriptionActions.setLevelCounter({levelCounter: value}));
  }

  get secondsPerLine(): number {
    return this._snapshot.transcription.secondsPerLine;
  }

  set secondsPerLine(value: number) {
    this.store.dispatch(fromTranscriptionActions.setSecondsPerLine({
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
    this.store.dispatch(fromTranscriptionActions.setHighlightingEnabled({
      highlightingEnabled: value
    }));
  }

  constructor(public sessStr: SessionStorageService,
              public localStr: LocalStorageService,
              private store: Store<RootState>,
              private actions: Actions) {
    this.subscrManager.add(actions.subscribe((action) => {
      if (action.type === '@ngrx/effects/init') {
        this.store.dispatch(fromTranscriptionActions.setTranscriptionState({
          ...fromTranscriptionReducer.initialState,
          playOnHover: this.sessStr.retrieve('playonhover'),
          followPlayCursor: this.sessStr.retrieve('followplaycursor')
        }));

        this.store.dispatch(fromLoginActions.setJobsLeft({jobsLeft: this.sessStr.retrieve('jobsLeft')}));

        this.store.dispatch(fromIDBActions.loadIDB());

        this.store.dispatch(fromLoginActions.setLoggedIn({
          loggedIn: this.sessStr.retrieve('loggedIn')
        }));
        this.reloaded = this.sessStr.retrieve('reloaded');
        this.serverDataEntry = this.sessStr.retrieve('serverDataEntry');
      }
    }));

    this.subscrManager.add(this.store.subscribe((state: RootState) => {
      this._snapshot = state;
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
    this.store.dispatch(fromTranscriptionActions.setSavingNeeded({savingNeeded: value}));
  }

  set followPlayCursor(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setFollowPlayCursor({
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
    return this._snapshot.login.onlineSession?.jobsLeft;
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
    return this._snapshot.login.onlineSession.serverDataEntry;
  }

  get submitted(): boolean {
    return this._snapshot.transcription.submitted;
  }

  setLogs(value: any[]) {
    this.store.dispatch(fromTranscriptionActions.setLogs({logs: value}));
  }

  get asrSelectedLanguage(): string {
    return this._snapshot.asr.selectedLanguage;
  }

  set asrSelectedLanguage(value: string) {
    this.store.dispatch(fromASRActions.setASRSettings({
      selectedLanguage: value,
      selectedService: this.asrSelectedService
    }));
  }

  get asrSelectedService(): string {
    return this._snapshot.asr.selectedService;
  }

  set asrSelectedService(value: string) {
    this.store.dispatch(fromASRActions.setASRSettings({
      selectedLanguage: this.asrSelectedLanguage,
      selectedService: value
    }));
  }

  public get audioVolume(): number {
    return this._snapshot.transcription.audioSettings.volume;
  }

  public set audioVolume(value: number) {
    this.store.dispatch(fromTranscriptionActions.setAudioSettings({
      volume: value,
      speed: this.audioSpeed
    }));
  }

  public get audioSpeed(): number {
    return this._snapshot.transcription.audioSettings.speed;
  }

  public set audioSpeed(value: number) {
    this.store.dispatch(fromTranscriptionActions.setAudioSettings({
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
    this.store.dispatch(fromTranscriptionActions.setIsSaving({isSaving: value}));
  }

  get audioURL(): string {
    return this._snapshot.login.onlineSession?.audioURL;
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
    this.store.dispatch(fromTranscriptionActions.setCurrentEditor({currentEditor: newInterface}));
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
          if (!keepData || (!isUnset(onlineSession))) {
            // last was online mode
            this.clearSession();
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

        this.store.dispatch(fromTranscriptionActions.overwriteAnnotation({
          annotation: {
            levels,
            links,
            levelCounter: max
          }
        }));
      }

      resolve();
    });
  }

  public overwriteLinks = (value: OIDBLink[]) => {
    this.store.dispatch(fromTranscriptionActions.overwriteLinks({
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
      this.store.dispatch(fromLoginActions.loginOnline({
        onlineSession: {
          dataID,
          audioURL,
          id: member.id,
          project: member.project,
          jobNumber: member.jobno,
          promptText,
          serverComment,
          jobsLeft,
          serverDataEntry: null,
          comment: '',
          password: member.password
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

    this.store.dispatch(fromLoginActions.loginLocal({files, sessionFile}));
    this.login = true;
  }

  setDemoSession(audioURL: string, serverComment: string, jobsLeft: number) {
    if (isUnset(this.easymode)) {
      this.easymode = false;
    }

    if (isUnset(this.interface)) {
      this.interface = '2D-Editor';
    }

    this.store.dispatch(fromLoginActions.loginDemo({
      onlineSession: {
        id: 'demo_user',
        project: 'demo',
        jobNumber: -1,
        dataID: 21343134,
        promptText: '',
        serverDataEntry: null,
        comment: '',
        password: '',
        audioURL,
        serverComment,
        jobsLeft
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

    this.store.dispatch(fromLoginActions.loginURLParameters({
      urlParams: {
        audio,
        transcript,
        embedded,
        host
      }
    }))
    this.login = true;
  }

  public clearSession(): boolean {
    this.login = false;
    this.store.dispatch(fromLoginActions.clearOnlineSession());

    this.sessStr.clear();
    return (isUnset(this.sessStr.retrieve('member_id')));
  }

  public clearLocalStorage() {
    this.login = false;
    this.store.dispatch(fromTranscriptionActions.clearAnnotation());
    this.store.dispatch(fromLoginActions.clearLocalSession());
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
          this.changeAnnotationLevel(value.num, value.level);
          // TODO wait until finished!
          /*.then(
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
        });*/
          break;
        case 'feedback':
          this.store.dispatch(fromTranscriptionActions.setFeedback({
            feedback: value
          }));

          this.isSaving = false;
          this.savingNeeded = false;
          this.saving.emit('success');

          // TODO onError
          /*
          this.isSaving = false;
            this.savingNeeded = false;
            this.saving.emit('error');
            console.error(err);
           */
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

      this.store.dispatch(fromTranscriptionActions.addLog({
        log: log
      }));
    } else {
      console.error('Can\'t save log because it is null.');
    }
  }

  public endSession(): Promise<void> {
    return new Promise<void>((resolve) => {
      // TODO wait until cleaned!
      this.clearSession();
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

  private observeStore() {
    this.subscrManager.add(this.store.subscribe(
      (state) => {
        console.log(state);
      }
    ));
  }

  public changeAnnotationLevel(tiernum: number, level: OLevel) {
    if (!isUnset(this.annotationLevels)) {
      if (!isUnset(level)) {
        if (this.annotationLevels.length > tiernum) {
          const changedLevel = this.annotationLevels[tiernum];
          const id = changedLevel.id;

          this.store.dispatch(fromTranscriptionActions.changeAnnotationLevel({
            level,
            id,
            sortorder: tiernum
          }));
        } else {
          console.error('number of level that should be changed is invalid');
        }
      } else {
        console.error(new Error('level is undefined or null'));
      }
    } else {
      console.error('annotation object is undefined or null');
    }
  }

  public addAnnotationLevel(level: OLevel): Promise<any> {
    if (!isUnset(level)) {
      const newID = this.levelcounter + 1;
      this.levelcounter = newID;

      this.store.dispatch(fromTranscriptionActions.addAnnotationLevel({
        id: newID,
        level,
        sortorder: this.annotationLevels.length
      }));
    } else {
      return new Promise((resolve, reject2) => {
        reject2(new Error('level is undefined or null'));
      });
    }
  }

  public removeAnnotationLevel(id: number): Promise<any> {
    if (id > -1) {
      this.store.dispatch(fromTranscriptionActions.removeAnnotationLevel({
        id
      }));
    } else {
      return new Promise((resolve, reject2) => {
        reject2(new Error('level is undefined or null'));
      });
    }
  }

  public clearLoggingData() {
    this.store.dispatch(fromTranscriptionActions.clearLogs());
  }

  public getLevelByID(id: number) {
    for (const level of this.annotationLevels) {
      if (level.id === id) {
        return level;
      }
    }
    return null;
  }
}
