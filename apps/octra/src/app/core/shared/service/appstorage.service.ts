import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorage, SessionStorageService} from 'ngx-webstorage';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {IDataEntry} from '../../obj/data-entry';
import {IndexedDBManager} from '../../obj/IndexedDBManager';
import {SessionFile} from '../../obj/SessionFile';
import {ConsoleEntry} from './bug-report.service';
import {FileProgress} from '../../obj/objects';
import {isUnset, SubscriptionManager} from '@octra/utilities';
import {OLevel, OLink} from '@octra/annotation';
import {LoginMode, OnlineSession, RootState} from '../../store';
import {Store} from '@ngrx/store';
import * as fromApplication from '../../store/application/';
import * as fromASR from '../../store/asr/';
import * as fromLogin from '../../store/login/';
import {AudioManager} from '@octra/media';
import * as fromApplicationActions from '../../store/application/application.actions';
import * as fromLoginActions from '../../store/login/login.actions';
import * as fromASRActions from '../../store/asr/asr.actions';
import * as fromTranscriptionActions from '../../store/transcription/transcription.actions';
import * as fromTranscription from '../../store/transcription';
import {map} from 'rxjs/operators';

export interface IIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;
}

export interface IIDBLink {
  id: number;
  link: OLink;
}

export class OIDBLevel implements IIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;

  constructor(id: number, level: OLevel, sortorder: number) {
    this.id = id;
    this.level = level;
    this.sortorder = sortorder;
  }
}

export class OIDBLink implements IIDBLink {
  id: number;
  link: OLink;

  constructor(id: number, link: OLink) {
    this.id = id;
    this.link = link;
  }
}

@Injectable()
export class AppStorageService {

  set savingNeeded(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setSavingNeeded({savingNeeded: value}));
  }

  get followplaycursor(): boolean {
    return this._followplaycursor;
  }

  set followplaycursor(value: boolean) {
    this._followplaycursor = value;
  }

  get idbloaded(): boolean {
    return this._idbloaded;
  }

  get loaded(): EventEmitter<any> {
    return this._loaded;
  }

  get idb(): IndexedDBManager {
    return this._idb;
  }

  get sessionfile(): SessionFile {
    return SessionFile.fromAny(this._sessionfile);
  }

  set sessionfile(value: SessionFile) {
    this._sessionfile = (!(value === null || value === undefined)) ? value.toAny() : null;
    this.idb.save('options', 'sessionfile', {value: this._sessionfile})
      .catch((err) => {
        console.error(err);
      });
  }

  public getOnlineSession(): Promise<OnlineSession> {
    return this.store.select(fromLogin.selectOnlineSession).toPromise();
  }

  setUserData(value: {
    id: string,
    project: string,
    jobNumber: number
  }) {
    this.store.dispatch(fromLoginActions.setUserData(value));
    this._idb.save('options', 'user', {value}).catch((err) => {
      console.error(err);
    });
  }

  get userProfile(): { userName: string; email: string } {
    return this._userProfile;
  }

  set userProfile(value: { userName: string; email: string }) {
    this._idb.save('options', 'userProfile', {value}).catch((err) => {
      console.error(err);
    });
    this._userProfile = value;
  }

  get agreement(): any {
    return this._agreement;
  }

  set agreement(value: any) {
    this._agreement = value;
  }

  get playonhover(): boolean {
    return this._playonhover;
  }

  set playonhover(value: boolean) {
    this._playonhover = value;
  }

  get reloaded(): boolean {
    return this._reloaded;
  }

  set reloaded(value: boolean) {
    this._reloaded = value;
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  /* Getter/Setter SessionStorage */
  get serverDataEntry(): IDataEntry {
    return this._serverDataEntry;
  }

  set serverDataEntry(value: IDataEntry) {
    this._serverDataEntry = value;
  }

  get submitted(): boolean {
    return this._submitted;
  }

  set submitted(value: boolean) {
    this._submitted = value;
    this.idb.save('options', 'submitted', {value}).catch((err) => {
      console.error(err);
    });
  }

  get feedback(): any {
    return this._feedback;
  }

  set feedback(value: any) {
    this._feedback = value;
    this._idb.save('options', 'feedback', {value}).catch((err) => {
      console.error(err);
    });
  }

  get logs(): any[] {
    return this._logs;
  }

  set logs(value: any[]) {
    this._idb.saveArraySequential(value, 'logs', 'timestamp').catch((err) => {
      console.error(err);
    });
    this._logs = value;
  }

  get dataID(): number {
    return this._dataID;
  }

  set dataID(value: number) {
    this._dataID = value;
    this.idb.save('options', 'dataID', {value}).catch((err) => {
      console.error(err);
    });
  }

  set audioURL(value: string) {
    this.store.dispatch(fromLoginActions.setAudioURL({audioURL: value}));
    if (this.usemode !== 'url') {
      this.idb.save('options', 'audioURL', {value}).catch((err) => {
        console.error(err);
      });
    }
  }

  set usemode(value: LoginMode) {
    this._usemode = value;
    this.store.dispatch(fromLoginActions.setMode({mode: value}));
    this.idb.save('options', 'usemode', {value}).catch((err) => {
      console.error(err);
    });
  }

  get language(): string {
    return this._language;
  }

  set language(value: string) {
    this._language = value;
    this.idb.save('options', 'language', {value}).catch((err) => {
      console.error(err);
    });
  }

  /* Getter/Setter IDB Storage */
  get version(): string {
    return this._version;
  }

  set version(value: string) {
    this._version = value;
    this._idb.save('options', 'version', {value}).catch((err) => {
      console.error(err);
    });
  }

  get logging(): boolean {
    return this._logging;
  }

  set logging(value: boolean) {
    this._logging = value;
    this._idb.save('options', 'logging', {value}).catch((err) => {
      console.error(err);
    });
  }

  get showLoupe(): boolean {
    return this._showLoupe;
  }

  set showLoupe(value: boolean) {
    this._showLoupe = value;
    this._idb.save('options', 'showLoupe', {value}).catch((err) => {
      console.error(err);
    });
  }

  get prompttext(): string {
    return this._prompttext;
  }

  set prompttext(value: string) {
    this._prompttext = value;
    this._idb.save('options', 'prompttext', {value}).catch((err) => {
      console.error(err);
    });
  }

  get urlParams(): any {
    return this._urlParams;
  }

  set urlParams(value: any) {
    this._urlParams = value;
  }

  get easymode(): boolean {
    return this._easymode;
  }

  set easymode(value: boolean) {
    this._easymode = value;
    this.idb.save('options', 'easymode', {value}).catch((err) => {
      console.error(err);
    });
  }

  get comment(): string {
    return this._comment;
  }

  set comment(value: string) {
    this._comment = value;
    this._idb.save('options', 'comment', {value}).catch((err) => {
      console.error(err);
    });
  }

  get servercomment(): string {
    return this._servercomment;
  }

  set servercomment(value: string) {
    this._servercomment = value;
    this.idb.save('options', 'servercomment', {value}).catch((err) => {
      console.error(err);
    });
  }

  get annotation(): OIDBLevel[] {
    return this._annotation;
  }

  get annotationLinks(): OIDBLink[] {
    return this._annotationLinks;
  }

  get levelcounter(): number {
    return this._levelcounter;
  }

  get secondsPerLine(): number {
    return this._secondsPerLine;
  }

  set secondsPerLine(value: number) {
    this._secondsPerLine = value;
    this.settingschange.next({
      key: 'secondsPerLine',
      value
    });
    this.idb.save('options', 'secondsPerLine', {value}).catch((err) => {
      console.error(err);
    });
  }

  get highlightingEnabled(): boolean {
    return this._highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this._highlightingEnabled = value;
    this.idb.save('options', 'highlightingEnabled', {value}).catch((err) => {
      console.error(err);
    });
  }

  constructor(public sessStr: SessionStorageService,
              public localStr: LocalStorageService,
              private store: Store<RootState>) {
    // TODO load data from DB and place it in store
    // TODO listen to state changes and save it to the IndexedDB
    // TODO make all properties private

    this.setLoggedIn(this.sessStr.retrieve('_loggedIn'));
  }

  // SESSION STORAGE
  @SessionStorage() logInTime: number; // timestamp
  @SessionStorage('jobsLeft') jobsLeft: number;

  public saving: EventEmitter<string> = new EventEmitter<string>();
  public loginActivityChanged = new Subject<boolean>();
  public settingschange = new Subject<{ key: string, value: any }>();

  // is user on the login page?
  private login: boolean;

  private subscrManager = new SubscriptionManager();

  @SessionStorage('followplaycursor') private _followplaycursor: boolean;

  // IDB STORAGE
  private _idbloaded = false;

  private _loaded = new EventEmitter();

  private _idb: IndexedDBManager;

  private _sessionfile: any = null;

  private _userProfile: {
    userName: string,
    email: string
  } = {
    userName: '',
    email: ''
  };

  @SessionStorage('agreement') private _agreement: any;

  @SessionStorage('playonhover') private _playonhover: boolean;

  @SessionStorage('reloaded') private _reloaded: boolean;

  @SessionStorage('email') private _email: string;

  @SessionStorage('serverDataEntry') private _serverDataEntry: IDataEntry;

  private _submitted: boolean = null;

  private _feedback: any = null;

  private _logs: any[] = [];

  private _dataID: number = null;

  private _usemode: LoginMode = null;

  private _language = null;

  private _version: string = null;

  private _logging = false;

  private _showLoupe = false;

  private _prompttext = '';

  private _urlParams: any = {};

  private _easymode = false;

  private _comment = '';

  private _servercomment = '';

  private _annotation: OIDBLevel[] = null;

  private _annotationLinks: OIDBLink[] = null;

  private _levelcounter = 0;

  private _secondsPerLine = 5;

  private _highlightingEnabled = true;

  async getASRSelectedLanguage(): Promise<string> {
    return this.store.select(fromASR.selectSelectedLanguage).toPromise();
  }

  async setASRSelectedLanguage(value: string) {
    this.store.dispatch(fromASRActions.setASRLanguage({selectedLanguage: value}));
    const selectedService = await this.getASRSelectedService();
    this.idb.save('options', 'asr', {
      value: {
        selectedLanguage: value,
        selectedService: selectedService
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  async getASRSelectedService(): Promise<string> {
    return this.store.select(fromASR.selectSelectedService).toPromise();
  }

  async setASRSelectedService(value: string) {
    this.store.dispatch(fromASRActions.setASRService({
      selectedService: value
    }));
    const selectedLanguage = await this.getASRSelectedLanguage();
    this.idb.save('options', 'asr', {
      value: {
        selectedLanguage: selectedLanguage,
        selectedService: value
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  public async getAudioVolume(): Promise<number> {
    return this.store.select(fromApplication.selectAudioVolume).toPromise();
  }

  public async setAudioVolume(value: number) {
    const audioSpeed = await this.getAudioSpeed();
    this.store.dispatch(fromApplicationActions.setAudioVolume({volume: value}));
    this.idb.save('options', 'audioSettings', {
      value: {
        volume: value,
        speed: audioSpeed
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  public async getAudioSpeed(): Promise<number> {
    return this.store.select(fromApplication.selectAudioSpeed).toPromise();
  }

  public async setAudioSpeed(value: number) {
    const audioVolume = await this.getAudioVolume();
    this.store.dispatch(fromApplicationActions.setAudioSpeed({speed: value}));
    this.idb.save('options', 'audioSettings', {
      value: {
        speed: value,
        volume: audioVolume
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  getSavingNeeded(): Promise<boolean> {
    return this.store.select(fromTranscription.selectSavingNeeded).toPromise();
  }

  async getIsSaving(): Promise<boolean> {
    return this.store.select(fromTranscription.selectIsSaving).toPromise();
  }

  setIsSaving(value: boolean) {
    this.store.dispatch(fromTranscriptionActions.setIsSaving({isSaving: value}));
  }

  async getAudioURL(): Promise<string> {
    return this.store.select(fromLogin.selectOnlineSession).pipe(map(session => session.audioURL)).toPromise();
  }

  async getUseMode(): Promise<LoginMode> {
    return this.store.select(fromLogin.selectMode).toPromise();
  }

  setLoggedIn(value: boolean) {
    this.loginActivityChanged.next(value);
  }

  async getLoggedIn(): Promise<boolean> {
    return this.store.select(fromLogin.selectLoggedIn).toPromise();
  }

  async getInterface(): Promise<string> {
    return this.store.select(fromApplication.selectCurrentEditor).toPromise();
  }

  setInterface(newInterface: string) {
    this.store.dispatch(fromApplicationActions.setCurrentEditor({currentEditor: newInterface}));
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

        const onlineSession = await this.store.select(fromLogin.selectOnlineSession);

        const process = () => {
          this.setSessionData(null, null, null, true).then(() => {
            this.sessionfile = this.getSessionFile(audiofile);
            resolve();
          });
        };

        if (!isUnset(audiofile)) {
          if (!keepData || (!isUnset(onlineSession))) {
            // last was online mode
            this.clearSession();
            this.clearLocalStorage().then(() => {
              process();
            });
          } else {
            process();
          }
        } else {
          reject('type not supported');
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
      this._annotation = value;
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

          this._levelcounter = max;
        }
      ).catch((err) => {
        console.error(err);
      });
    });
  }

  public overwriteLinks = (value: OIDBLink[]): Promise<any> => {
    return this.clearIDBTable('annotation_links')
      .then(() => {
        this._annotationLinks = value;
      }).catch((err) => {
        console.error(err);
      }).then(() => {
        return this._idb.saveArraySequential(value, 'annotation_links', 'id');
      });
  }

  public setSessionData(member: any, dataID: number, audioURL: string, offline: boolean = false): Promise<void> {
    return new Promise<void>(async (resolve) => {
      if (isUnset(this._easymode)) {
        this._easymode = false;
      }

      const currentEditor = await this.getInterface();

      if (offline && (isUnset(member))) {

        if (isUnset(currentEditor)) {
          this.setInterface('2D-Editor');
        }
        this.setNewSessionKey();
        this.usemode = LoginMode.LOCAL;
        this.user = {
          id: '-1',
          project: '',
          jobno: -1
        };
        this.login = true;
      }

      if (!this.login && !offline && (!isUnset(member))) {
        if (isUnset(currentEditor)) {
          this.setInterface('2D-Editor');
        }
        this.setNewSessionKey();

        this.dataID = dataID;
        this.sessStr.store('_loggedIn', true);
        this.sessStr.store('interface', currentEditor);
        this.audioURL = audioURL;
        this.user = {
          id: member.id,
          project: member.project,
          jobno: member.jobno
        };
        this.usemode = LoginMode.ONLINE;

        this.login = true;
      }

      resolve();
    });
  }

  public clearSession(): boolean {
    this.store.dispatch(fromLoginActions.logout());
    this.login = false;
    this.audioURL = null;

    this.sessStr.clear();

    return ((this.sessStr.retrieve('sessionKey') === null || this.sessStr.retrieve('sessionKey') === undefined)
      && (this.sessStr.retrieve('member_id') === null || this.sessStr.retrieve('member_id') === undefined));
  }

  public clearLocalStorage(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.login = false;
      this.dataID = null;

      const promises: Promise<any>[] = [];
      promises.push(this.idb.save('options', 'user', {value: null}));
      promises.push(this.idb.save('options', 'feedback', {value: null}));
      promises.push(this.idb.save('options', 'comment', {value: ''}));
      promises.push(this.idb.save('options', 'audioURL', {value: null}));
      promises.push(this.idb.save('options', 'dataID', {value: null}));
      promises.push(this.idb.save('options', 'sessionfile', {value: null}));
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
    if (this.usemode !== 'url') {
      if (key === 'annotation' || key === 'feedback') {
        this.getIsSaving() = true;
        this.saving.emit('saving');
      }

      switch (key) {
        case 'annotation':
          this.changeAnnotationLevel(value.num, value.level).then(
            () => {
              this._isSaving = false;
              this._savingNeeded = false;
              this.saving.emit('success');
            }
          ).catch((err) => {
            this._isSaving = false;
            this._savingNeeded = false;
            this.saving.emit('error');
            console.error(`error on saving`);
            console.error(err);
          });
          break;
        case 'feedback':
          this._idb.save('options', 'feedback', {value}).then(
            () => {
              this._isSaving = false;
              this._savingNeeded = false;
              this.saving.emit('success');
            }
          ).catch((err) => {
            this._isSaving = false;
            this._savingNeeded = false;
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

  // TODO make this method return a Promise
  public endSession(navigate: () => void) {
    this.clearSession();
    navigate();
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
          key: 'usemode'
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
        this._logs = logs;
      });

      console.log(this._audioSettings);
    }).then(() => {
      idb.getAll('annotation_levels', 'id').then((levels: any[]) => {
        this._annotation = [];
        let max = 0;
        for (let i = 0; i < levels.length; i++) {
          if (!levels[i].hasOwnProperty('id')) {
            this._annotation.push(
              {
                id: i + 1,
                level: levels[i],
                sortorder: i
              }
            );
            max = Math.max(i + 1, max);
          } else {
            this._annotation.push(levels[i]);
            max = Math.max(levels[i].id, max);
          }
        }
        this._levelcounter = max;
      });
    }).then(() => {
      idb.getAll('annotation_links', 'id').then((links: IIDBLink[]) => {
        this._annotationLinks = [];
        for (let i = 0; i < links.length; i++) {
          if (!links[i].hasOwnProperty('id')) {
            this._annotationLinks.push(
              new OIDBLink(i + 1, links[i].link)
            );
          } else {
            this._annotationLinks.push(links[i]);
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
    return new Promise<void>((resolve, reject) => {
      if (this._isSaving || this._savingNeeded) {
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
    this._annotation = null;
    return this.clearIDBTable('annotation_levels').then(
      () => {
        return this.clearIDBTable('annotation_links');
      });
  }

  public clearOptions(): Promise<any> {
    return this.clearIDBTable('options');
  }

  public changeAnnotationLevel(tiernum: number, level: OLevel): Promise<any> {
    if (!isUnset(this._annotation)) {
      if (!(level === null || level === undefined)) {
        if (this._annotation.length > tiernum) {
          const id = this._annotation[tiernum].id;

          this._annotation[tiernum].level = level;
          return this.idb.save('annotation_levels', id, this._annotation[tiernum]);
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
    if (!(level === null || level === undefined)) {
      this._annotation.push({
        id: ++this._levelcounter,
        level,
        sortorder: this._annotation.length
      });
      return this.idb.save('annotation_levels', this._levelcounter, {
        id: this._levelcounter,
        level
      });
    } else {
      return new Promise((resolve, reject2) => {
        reject2(new Error('level is undefined or null'));
      });
    }
  }

  public removeAnnotationLevel(num: number, id: number): Promise<any> {
    if (!(name === null || name === undefined) && num < this._annotation.length) {
      return this.idb.remove('annotation_levels', id).then(
        () => {
          this._annotation.splice(num, 1);
        }
      );
    } else {
      return new Promise((resolve, reject2) => {
        reject2(new Error('level is undefined or null'));
      });
    }
  }

  public clearLoggingData(): Promise<any> {
    this._logs = null;
    return this.clearIDBTable('logs');
  }

  public getLevelByID(id: number) {
    for (const level of this._annotation) {
      if (level.id === id) {
        return level;
      }
    }
    return null;
  }

  public saveUser() {
    this._idb.save('options', 'user', {value: this._user}).catch((err) => {
      console.error(err);
    });
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

  private saveOptionToStore(attribute: string, value: string) {
    console.log(`save Option ${attribute} to store...`);
    switch (attribute) {
      case('_interface'):
        this.store.dispatch(fromApplicationActions.setCurrentEditor({currentEditor: value}));
        break;
      default:
        console.error(`can't find case for attribute ${attribute}`);
    }
  }

  /**
   * Sets sessionKey. Returns true on success, false on failure
   */
  private setNewSessionKey() {
    this.sessionKey = '';
    this.sessStr.store('sessionKey', this.sessionKey);
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
