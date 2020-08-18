import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorageService} from 'ngx-webstorage';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {IDataEntry} from '../../obj/data-entry';
import {IndexedDBManager} from '../../obj/IndexedDBManager';
import {SessionFile} from '../../obj/SessionFile';
import {ConsoleEntry} from './bug-report.service';
import {FileProgress} from '../../obj/objects';
import {isUnset, SubscriptionManager} from '@octra/utilities';
import {IIDBLink, OIDBLevel, OIDBLink, OLevel} from '@octra/annotation';
import {LoginMode, OnlineSession, RootState} from '../../store';
import {Store} from '@ngrx/store';
import * as fromApplication from '../../store/application/';
import * as fromLogin from '../../store/login/';
import {AudioManager} from '@octra/media';
import * as fromApplicationActions from '../../store/application/application.actions';
import * as fromLoginActions from '../../store/login/login.actions';
import * as fromASRActions from '../../store/asr/asr.actions';
import * as fromTranscriptionActions from '../../store/transcription/transcription.actions';
import * as fromTranscriptionReducer from '../../store/transcription/transcription.reducer';
import * as fromTranscription from '../../store/transcription';
import * as fromUserActions from '../../store/user/user.actions';
import * as fromIDBActions from '../../store/idb/idb.actions'
import {Actions} from '@ngrx/effects';

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

  get idb(): IndexedDBManager {
    return this._idb;
  }

  get sessionfile(): SessionFile {
    return this._snapshot.login.sessionFile;
  }

  set userProfile(value: { name: string; email: string }) {
    this.store.dispatch(fromUserActions.setUserProfile(value));
    console.log(`save userProfile...`);
    console.log(value);
    this._idb.save('options', 'userProfile', {value}).catch((err) => {
      console.error(err);
    });
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
    this.idb.save('options', 'submitted', {value}).catch((err) => {
      console.error(err);
    });
  }

  get feedback(): any {
    return this._snapshot.transcription.feedback;
  }

  set feedback(value: any) {
    this.store.dispatch(fromTranscriptionActions.setFeedback({feedback: value}));
    this._idb.save('options', 'feedback', {value}).catch((err) => {
      console.error(err);
    });
  }

  get dataID(): number {
    return this._snapshot.login.onlineSession?.dataID;
  }

  get language(): string {
    return this._snapshot.application.language;
  }

  set language(value: string) {
    this.store.dispatch(fromApplicationActions.setAppLanguage({language: value}));
    this.idb.save('options', 'language', {value}).catch((err) => {
      console.error(err);
    });
  }

  /* Getter/Setter IDB Storage */
  get version(): string {
    return this._snapshot.application.version;
  }

  set version(value: string) {
    this.store.dispatch(fromApplicationActions.setAppVersion({version: value}));
    this._idb.save('options', 'version', {value}).catch((err) => {
      console.error(err);
    });
  }

  get logging(): boolean {
    return this._snapshot.transcription.logging;
  }

  set logging(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setLogging({
      logging: value
    }));
    this._idb.save('options', 'logging', {value}).catch((err) => {
      console.error(err);
    });
  }

  get showLoupe(): boolean {
    return this._snapshot.transcription.showLoupe;
  }

  set showLoupe(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setShowLoupe({
      showLoupe: value
    }));
    this._idb.save('options', 'showLoupe', {value}).catch((err) => {
      console.error(err);
    });
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
    this.idb.save('options', 'easymode', {value}).catch((err) => {
      console.error(err);
    });
  }

  get comment(): string {
    return this._snapshot.login.onlineSession?.comment;
  }

  set comment(value: string) {
    this.store.dispatch(fromLoginActions.setComment({
      comment: value
    }));
    this._idb.save('options', 'comment', {value}).catch((err) => {
      console.error(err);
    });
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
    this.idb.save('options', 'secondsPerLine', {value}).catch((err) => {
      console.error(err);
    });
  }

  get highlightingEnabled(): boolean {
    return this._snapshot.transcription.highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setHighlightingEnabled({
      highlightingEnabled: value
    }));
    this.idb.save('options', 'highlightingEnabled', {value}).catch((err) => {
      console.error(err);
    });
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

        this.subscrManager.add(this.store.select(fromLogin.selectOnlineSession).subscribe((onlineSession) => {
          if (!isUnset(onlineSession)) {
            if (onlineSession.hasOwnProperty('serverDataEntry')) {
              this.sessStr.store('serverDataEntry', onlineSession.serverDataEntry);
            }
            if (onlineSession.hasOwnProperty('jobsLeft')) {
              this.sessStr.store('jobsLeft', onlineSession.jobsLeft);
            }

            if (!isUnset(this._idb)) {
              this.idb.save('options', 'dataID', {value: onlineSession.dataID}).catch((err) => {
                console.error(err);
              });

              this._idb.save('options', 'prompttext', {value: onlineSession.promptText}).catch((err) => {
                console.error(err);
              });

              this._idb.save('options', 'audioURL', {value: onlineSession.audioURL}).catch((err) => {
                console.error(err);
              });

              this._idb.save('options', 'user', {
                value: {
                  id: onlineSession.id,
                  jobno: onlineSession.jobNumber,
                  project: onlineSession.project
                }
              }).catch((err) => {
                console.error(err);
              });
            }
          }
        }));
        this.subscrManager.add(this.store.select(fromLogin.selectLoggedIn).subscribe((loggedIn) => {
          console.log(`saveLoggedIn: ${loggedIn}`);
          this.sessStr.store('loggedIn', loggedIn);
        }));
        this.subscrManager.add(this.store.select(fromTranscription.selectPlayOnHover).subscribe((playOnHover) => {
          this.sessStr.store('playonhover', playOnHover);
        }));
        this.subscrManager.add(this.store.select(fromApplication.selectReloaded).subscribe((reloaded) => {
          this.sessStr.store('reloaded', reloaded);
        }));

        this.subscrManager.add(this.store.select(fromLogin.selectMode).subscribe((mode) => {
          if (!isUnset(this.idb)) {
            this.idb.save('options', 'useMode', {value: mode}).catch((err) => {
              console.error(err);
            });
          }
        }));

        this.subscrManager.add(this.store.select(fromLogin.selectSessionFile).subscribe((sessionFile) => {
          const sessionFileAny = (!isUnset(sessionFile)) ? sessionFile.toAny() : null;

          if (!isUnset(this.idb)) {
            console.log(`SAVE SESSION FILE!`);
            console.log(sessionFile);
            this.idb.save('options', 'sessionfile', {value: sessionFileAny})
              .catch((err) => {
                console.error(err);
              });
          }
        }));
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

  private _idb: IndexedDBManager;

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
    this._idb.saveArraySequential(value, 'logs', 'timestamp').catch((err) => {
      console.error(err);
    });
  }

  get asrSelectedLanguage(): string {
    return this._snapshot.asr.selectedLanguage;
  }

  set asrSelectedLanguage(value: string) {
    this.store.dispatch(fromASRActions.setASRLanguage({selectedLanguage: value}));
    this.idb.save('options', 'asr', {
      value: {
        selectedLanguage: value,
        selectedService: this.asrSelectedService
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  get asrSelectedService(): string {
    return this._snapshot.asr.selectedService;
  }

  set asrSelectedService(value: string) {
    this.store.dispatch(fromASRActions.setASRService({
      selectedService: value
    }));
    this.idb.save('options', 'asr', {
      value: {
        selectedLanguage: this.asrSelectedLanguage,
        selectedService: value
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  public get audioVolume(): number {
    return this._snapshot.transcription.audioSettings.volume;
  }

  public set audioVolume(value: number) {
    this.store.dispatch(fromTranscriptionActions.setAudioVolume({volume: value}));
    this.idb.save('options', 'audioSettings', {
      value: {
        volume: value,
        speed: this.audioSpeed
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  public get audioSpeed(): number {
    return this._snapshot.transcription.audioSettings.speed;
  }

  public set audioSpeed(value: number) {
    this.store.dispatch(fromTranscriptionActions.setAudioSpeed({speed: value}));
    this.idb.save('options', 'audioSettings', {
      value: {
        speed: value,
        volume: this.audioVolume
      }
    }).catch((err) => {
      console.error(err);
    });
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
    this.idb.save('options', 'interface', {value: newInterface}).catch((err) => {
      console.error(err);
    });
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
            this.clearLocalStorage().then(() => {
              loginLocal();
            });
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

  public overwriteAnnotation = (value: OIDBLevel[], saveToDB = true): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
      if (saveToDB) {
        this.clearAnnotationData().then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      } else {
        resolve();
      }
    }).then(() => {
      this.store.dispatch(fromTranscriptionActions.setAnnotationLevels({levels: value}));
    }).catch((err) => {
      console.error(err);
    }).then(() => {
      return new Promise<any>((resolve, reject2) => {
        if (saveToDB) {
          this._idb.saveArraySequential(value, 'annotation_levels', 'id').then(() => {
            resolve();
          }).catch((error) => {
            reject2(error);
          });
        } else {
          resolve();
        }
      }).then(
        () => {
          let max = 0;

          for (const valueElem of value) {
            max = Math.max(max, valueElem.id);
          }

          this.store.dispatch(fromTranscriptionActions.setLevelCounter({
            levelCounter: max
          }));
        }
      ).catch((err) => {
        console.error(err);
      });
    });
  }

  public overwriteLinks = (value: OIDBLink[]): Promise<any> => {
    return this.clearIDBTable('annotation_links')
      .then(() => {
        this.store.dispatch(fromTranscriptionActions.setAnnotationLinks({links: value}));
      }).catch((err) => {
        console.error(err);
      }).then(() => {
        return this._idb.saveArraySequential(value, 'annotation_links', 'id');
      });
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
      audioURL,
      serverComment,
      jobsLeft
    }))
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

  public clearLocalStorage(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.login = false;
      this.store.dispatch(fromLoginActions.clearLocalSession());

      const promises: Promise<any>[] = [];
      promises.push(this.idb.save('options', 'user', {value: null}));
      promises.push(this.idb.save('options', 'feedback', {value: null}));
      promises.push(this.idb.save('options', 'comment', {value: ''}));
      promises.push(this.idb.save('options', 'audioURL', {value: null}));
      promises.push(this.idb.save('options', 'dataID', {value: null}));
      promises.push(this.clearLoggingData());

      this.clearAnnotationData().then(
        () => {
          Promise.all(promises).then(() => {
            resolve();
          }).catch((error) => {
            reject(error);
          });
        }
      );
    });
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
          this._idb.save('options', 'feedback', {value}).then(
            () => {
              this.isSaving = false;
              this.savingNeeded = false;
              this.saving.emit('success');
            }
          ).catch((err) => {
            this.isSaving = false;
            this.savingNeeded = false;
            this.saving.emit('error');
            console.error(err);
          });
          break;
        default:
          return false; // if key not found return false
      }
    }
    return true;
  }

  public saveLogItem(log: any) {
    if (!(log === null || log === undefined)) {
      for (const attr in log) {
        if (log.hasOwnProperty(attr) && isUnset(log['' + attr])) {
          delete log['' + attr];
        }
      }

      this._idb.save('logs', log.timestamp, log).catch((err) => {
        console.error(err);
      });
    } else {
      console.error('Can\'t save log because it is null.');
    }
  }

  public endSession(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.clearSession();
      this.clearLocalStorage().catch((error) => {
        console.error(error);
      });
      resolve();
    });
  }

  public load(idb: IndexedDBManager): Promise<void> {
    console.log('load from indexedDB');
    this._idb = idb;

    return this.loadOptions(
      [
        {
          attribute: '_submitted',
          key: 'submitted'
        },
        {
          attribute: '_version',
          key: 'version'
        },
        {
          attribute: '_easymode',
          key: 'easymode'
        },
        {
          attribute: '_audioURL',
          key: 'audioURL'
        },
        {
          attribute: '_comment',
          key: 'comment'
        },
        {
          attribute: '_dataID',
          key: 'dataID'
        },
        {
          attribute: '_feedback',
          key: 'feedback'
        },
        {
          attribute: '_language',
          key: 'language'
        },
        {
          attribute: '_sessionfile',
          key: 'sessionfile'
        },
        {
          attribute: '_usemode',
          key: 'useMode'
        },
        {
          attribute: '_user',
          key: 'user'
        },
        {
          attribute: '_userProfile',
          key: 'userProfile'
        },
        {
          attribute: '_interface',
          key: 'interface'
        },
        {
          attribute: '_logging',
          key: 'logging'
        },
        {
          attribute: '_showLoupe',
          key: 'showLoupe'
        },
        {
          attribute: '_prompttext',
          key: 'prompttext'
        },
        {
          attribute: '_servercomment',
          key: 'servercomment'
        },
        {
          attribute: '_secondsPerLine',
          key: 'secondsPerLine'
        },
        {
          attribute: '_audioSettings',
          key: 'audioSettings'
        },
        {
          attribute: '_asr',
          key: 'asr'
        },
        {
          attribute: '_highlightingEnabled',
          key: 'highlightingEnabled'
        }
      ]
    ).then(() => {
      idb.getAll('logs', 'timestamp').then((logs) => {
        this.store.dispatch(fromTranscriptionActions.setLogs({
          logs
        }));
      });
    }).then(() => {
      idb.getAll('annotation_levels', 'id').then((levels: any[]) => {
        const annotationLevels = [];
        let max = 0;
        for (let i = 0; i < levels.length; i++) {
          if (!levels[i].hasOwnProperty('id')) {
            annotationLevels.push(
              {
                id: i + 1,
                level: levels[i],
                sortorder: i
              }
            );
            max = Math.max(i + 1, max);
          } else {
            annotationLevels.push(levels[i]);
            max = Math.max(levels[i].id, max);
          }
        }
        this.store.dispatch(fromTranscriptionActions.setLevelCounter({
          levelCounter: max
        }));
      });
    }).then(() => {
      idb.getAll('annotation_links', 'id').then((links: IIDBLink[]) => {
        const annotationLinks = [];
        for (let i = 0; i < links.length; i++) {
          if (!links[i].hasOwnProperty('id')) {
            annotationLinks.push(
              new OIDBLink(i + 1, links[i].link)
            );
          } else {
            annotationLinks.push(links[i]);
          }
        }
      });
    }).then(
      () => {
        this.observeStore();
        this._loaded.complete();
      }
    );
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

  public clearAnnotationData(): Promise<any> {
    this.store.dispatch(fromTranscriptionActions.clearAnnotation());
    return this.clearIDBTable('annotation_levels').then(
      () => {
        return this.clearIDBTable('annotation_links');
      });
  }

  public clearOptions(): Promise<any> {
    return this.clearIDBTable('options');
  }

  public changeAnnotationLevel(tiernum: number, level: OLevel): Promise<any> {
    if (!isUnset(this.annotationLevels)) {
      if (!isUnset(level)) {
        if (this.annotationLevels.length > tiernum) {
          const changedLevel = this.annotationLevels[tiernum];
          const id = changedLevel.id;

          this.store.dispatch(fromTranscriptionActions.changeAnnotationLevel({
            level,
            index: tiernum
          }));
          changedLevel.level = level;

          return this.idb.save('annotation_levels', id, changedLevel);
        } else {
          return new Promise((resolve, reject) => {
            reject(new Error('number of level that should be changed is invalid'));
          });
        }
      } else {
        return new Promise((resolve, reject) => {
          reject(new Error('level is undefined or null'));
        });
      }
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error('annotation object is undefined or null'));
      });
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

      return this.idb.save('annotation_levels', newID, {
        id: newID,
        level
      });
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

  public clearLoggingData(): Promise<any> {
    this.store.dispatch(fromTranscriptionActions.setLogs({
      logs: []
    }));
    return this.clearIDBTable('logs');
  }

  public getLevelByID(id: number) {
    for (const level of this.annotationLevels) {
      if (level.id === id) {
        return level;
      }
    }
    return null;
  }

  public loadConsoleEntries(): Promise<ConsoleEntry[]> {
    return new Promise<ConsoleEntry[]>((resolve, reject) => {
      this._idb.get('options', 'console').then((entries) => {
        resolve(entries as ConsoleEntry[]);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public saveConsoleEntries(entries: ConsoleEntry[]) {
    if (!isUnset(this._idb)) {
      this._idb.save('options', 'console', {value: entries}).catch((err) => {
        console.error(err);
      });
    }
  }

  private loadOptions = (variables: { attribute: string, key: string }[]): Promise<void> => {
    return new Promise<void>(
      (resolve, reject) => {
        const promises: Promise<any>[] = [];
        for (const variable of variables) {
          if (variable.hasOwnProperty('attribute') && variable.hasOwnProperty('key')) {
            promises.push(this.loadOptionFromIDB(variable.key).then(
              (result) => {
                if (!(result === null || result === undefined)) {
                  this['' + variable.attribute + ''] = result;
                  this.saveOptionToStore(variable.attribute, result);
                }
              }
            ));
          } else {
            console.error(Error('loadOptions: variables parameter must be of type {attribute:string, key:string}[]'));
          }
        }

        // return when all operations have been finished
        Promise.all(promises).then(
          () => {
            resolve();
          },
          (error) => {
            reject(error);
          }
        );
      }
    );
  }

  private saveOptionToStore(attribute: string, value: any) {
    console.log(`save Option ${attribute} to store with value "${JSON.stringify(value)}"...`);
    switch (attribute) {
      case('_submitted'):
        this.store.dispatch(fromTranscriptionActions.setSubmitted({submitted: value}));
        break;
      case('_version'):
        this.store.dispatch(fromApplicationActions.setAppVersion({version: value}));
        break;
      case('_easymode'):
        this.store.dispatch(fromTranscriptionActions.setEasyMode({easyMode: value}));
        break;
      case('_audioURL'):
        this.store.dispatch(fromLoginActions.setAudioURL({audioURL: value}));
        break;
      case('_comment'):
        this.store.dispatch(fromLoginActions.setComment({comment: value}));
        break;
      case('_dataID'):
        this.store.dispatch(fromLoginActions.setUserData({
          project: this.onlineSession.project,
          id: value,
          jobNumber: this.onlineSession.jobNumber
        }));
        break;
      case('_feedback'):
        this.store.dispatch(fromTranscriptionActions.setFeedback(value));
        break;
      case('_interface'):
        this.store.dispatch(fromTranscriptionActions.setCurrentEditor({currentEditor: value}));
        break;
      case('_language'):
        this.store.dispatch(fromApplicationActions.setAppLanguage({language: value}));
        break;
      case('_sessionfile'):
        const sessionFile = SessionFile.fromAny(value);
        if (!isUnset(sessionFile)) {
          this.store.dispatch(fromLoginActions.setSessionFile({sessionFile}));
        }
        break;
      case('_usemode'):
        this.store.dispatch(fromLoginActions.setMode({mode: value}));
        break;
      case('_user'):
        const onlineSessionData = {
          jobNumber: -1,
          id: '',
          project: ''
        };

        if (value.hasOwnProperty('id')) {
          onlineSessionData.id = value.id;
        }
        if (value.hasOwnProperty('jobno')) {
          onlineSessionData.jobNumber = value.jobno;
        }

        if (value.hasOwnProperty('project')) {
          onlineSessionData.project = value.project;
        }
        this.store.dispatch(fromLoginActions.setUserData({...onlineSessionData}));
        break;
      case('_userProfile'):
        const userProfile = {
          name: '',
          email: ''
        };

        if (value.hasOwnProperty('name')) {
          userProfile.name = value.name;
        }
        if (value.hasOwnProperty('email')) {
          userProfile.email = value.email;
        }

        this.store.dispatch(fromUserActions.setUserProfile(userProfile));
        break;
      case('_logging'):
        this.store.dispatch(fromTranscriptionActions.setLogging({logging: value}));
        break;
      case('_showLoupe'):
        this.store.dispatch(fromTranscriptionActions.setShowLoupe({showLoupe: value}));
        break;
      case('_prompttext'):
        this.store.dispatch(fromLoginActions.setPromptText({promptText: value}));
        break;
      case('_servercomment'):
        this.store.dispatch(fromLoginActions.setServerComment({serverComment: value}));
        break;
      case('_secondsPerLine'):
        this.store.dispatch(fromTranscriptionActions.setSecondsPerLine({secondsPerLine: value}));
        break;
      case('_audioSettings'):
        if (value.hasOwnProperty('volume')) {
          this.store.dispatch(fromTranscriptionActions.setAudioVolume({volume: value.volume}));
        }
        if (value.hasOwnProperty('speed')) {
          this.store.dispatch(fromTranscriptionActions.setAudioSpeed({speed: value.speed}));
        }

        break;
      case('_asr'):
        if (value.hasOwnProperty('selectedLanguage')) {
          this.store.dispatch(fromASRActions.setASRLanguage({selectedLanguage: value.selectedLanguage}));
        }
        if (value.hasOwnProperty('selectedService')) {
          this.store.dispatch(fromASRActions.setASRService({selectedService: value.selectedService}));
        }
        break;
      case('_highlightingEnabled'):
        this.store.dispatch(fromTranscriptionActions.setHighlightingEnabled({highlightingEnabled: value}));
        break;
      default:
        console.error(`can't find case for attribute ${attribute}`);
    }
  }

  /**
   * loads the option by its key and sets its variable.
   * Notice: the variable is defined by '_' before the key string
   */
  private loadOptionFromIDB(key: string): Promise<any> {
    return new Promise<any>(
      (resolve, reject) => {
        if (!(this._idb === null || this._idb === undefined)) {
          if (typeof key === 'string') {
            this._idb.get('options', key).then(
              (result) => {
                const resObj = (!(result === null || result === undefined)) ? result.value : null;
                resolve(resObj);
              }
            ).catch((err) => {
              reject(err);
            });
          } else {
            reject(Error('loadOptionFromIDB: method needs key of type string'));
          }
        } else {
          reject(Error('loadOptionFromIDB: idb is null'));
        }
      }
    );
  }

  private clearIDBTable(name: string): Promise<any> {
    if (this._idb === undefined) {
      return new Promise<any>((resolve) => {
        resolve();
      });
    }
    return this._idb.clear(name);
  }
}
