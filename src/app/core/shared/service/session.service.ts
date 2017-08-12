import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorage, SessionStorageService} from 'ng2-webstorage';
import {SessionFile} from '../../obj/SessionFile';
import {isNullOrUndefined} from 'util';
import {OLevel} from '../../obj/annotjson';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {AppInfo} from '../../../app.info';
import {IndexedDBManager} from '../../obj/IndexedDBManager';

@Injectable()
export class SessionService {
  get idb(): IndexedDBManager {
    return this._idb;
  }

  /* Getter/Setter SessionStorage */
  get servertranscipt(): any[] {
    return this._servertranscipt;
  }

  set servertranscipt(value: any[]) {
    this._servertranscipt = value;
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    this._email = value;
  }

  get reloaded(): boolean {
    return this._reloaded;
  }

  set reloaded(value: boolean) {
    this._reloaded = value;
  }

  get playonhover(): boolean {
    return this._playonhover;
  }

  set playonhover(value: boolean) {
    this._playonhover = value;
  }

  get agreement(): any {
    return this._agreement;
  }

  set agreement(value: any) {
    this._agreement = value;
  }


  /* Getter/Setter IDB Storage */
  get version(): string {
    return this._version;
  }

  set version(value: string) {
    this._version = value;
    this._idb.save('options', 'version', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get annotation(): OLevel[] {
    return this._annotation;
  }

  set comment(value: string) {
    this._comment = value;
    this._idb.save('options', 'comment', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get comment(): string {
    return this._comment;
  }

  get easymode(): boolean {
    return this._easymode;
  }

  set easymode(value: boolean) {
    this._easymode = value;
  }

  set language(value: string) {
    this._language = value;
    this.sessStr.store('language', this._language);
  }

  get language(): string {
    return this._language;
  }

  get sessionfile(): SessionFile {
    return SessionFile.fromAny(this._sessionfile);
  }

  set sessionfile(value: SessionFile) {
    this._sessionfile = (!isNullOrUndefined(value)) ? value.toAny() : null;
    this.localStr.store('sessionfile', this._sessionfile);
  }

  get uselocalmode(): boolean {
    return this._uselocalmode;
  }

  set uselocalmode(value: boolean) {
    this._uselocalmode = value;
    this.sessStr.store('offline', value);
  }

  get audio_url(): string {
    return this._audio_url;
  }

  set audio_url(value: string) {
    this._audio_url = value;
    this.localStr.store('audio_url', value);
  }

  get data_id(): number {
    return this._data_id;
  }

  set data_id(value: number) {
    this._data_id = value;
    this.localStr.store('data_id', value);
  }

  get logs(): any[] {
    return this._logs;
  }

  get feedback(): any {
    return this._feedback;
  }

  get submitted(): boolean {
    return this._submitted;
  }

  set submitted(value: boolean) {
    this._submitted = value;
  }

  get user(): {
    id: string,
    project: string,
    jobno: number
  } {
    return this._user;
  }

  set user(value: {
    id: string,
    project: string,
    jobno: number
  }) {
    this._user = value;
    this._idb.save('options', 'user', this._user).then((result) => {
      console.log('USER saved');
      console.log(result);
    });
  }

  // SESSION STORAGE
  @SessionStorage('session_key') session_key: string;
  @SessionStorage() logged_in: boolean;
  @SessionStorage() logInTime: number; // timestamp
  @SessionStorage('interface') _interface: string;

  @SessionStorage('agreement') private _agreement: any;
  @SessionStorage('jobs_left') jobs_left: number;
  @SessionStorage('playonhover') private _playonhover: boolean;
  @SessionStorage('reloaded') private _reloaded: boolean;
  @SessionStorage('email') private _email: string;
  @SessionStorage('servertranscript') private _servertranscipt: any[];

  // IDB STORAGE
  private _idb: IndexedDBManager;
  private _submitted: boolean = null;
  private _feedback: any = null;
  private _logs: any[] = [];
  private _data_id: number = null;
  private _audio_url: string = null;
  private _uselocalmode: boolean = null;
  private _sessionfile: any = null;
  private _language = 'en';
  private _version: string = null;

  private _user: {
    id: string,
    project: string,
    jobno: number
  } = null;
  private _easymode = false;
  private _comment = '';
  private _annotation: OLevel[] = null;

  // is user on the login page?
  private login: boolean;

  public file: File;
  public saving: EventEmitter<boolean> = new EventEmitter<boolean>();

  get LoggedIn(): boolean {
    return this.logged_in;
  }

  get Interface(): string {
    return this._interface;
  }

  set Interface(new_interface: string) {
    this._interface = new_interface;
    this.sessStr.store('interface', new_interface);
  }

  constructor(public sessStr: SessionStorageService,
              public localStr: LocalStorageService) {
  }

  /**
   * Sets session_key. Returns true on success, false on failure
   * @param member_id
   * @returns {boolean}
   */
  private setNewSessionKey() {
    this.session_key = '';
    this.sessStr.store('session_key', this.session_key);
  }

  public setSessionData(member: any, data_id: number, audio_url: string, offline: boolean = false): { error: string } {
    if (isNullOrUndefined(this._easymode)) {
      this._easymode = false;
    }
    if (offline && (isNullOrUndefined(member))) {
      if (isNullOrUndefined(this._interface)) {
        this._interface = '2D-Editor';
      }
      this.setNewSessionKey();
      this.localStr.store('offline', true);
      this.localStr.store('member_project', '');
      this.localStr.store('member_jobno', '-1');
      this.setMemberID('-1');
      this.login = true;
      this.logged_in = true;

      return {error: ''};
    }

    if (!this.login && !offline && (!isNullOrUndefined(member))) {
      if (isNullOrUndefined(this._interface)) {
        this._interface = '2D-Editor';
      }
      this.setNewSessionKey();
      this.setMemberID(member.id);

      this.localStr.store('data_id', data_id);
      this.sessStr.store('logged_in', this.logged_in);
      this.sessStr.store('interface', this._interface);
      this.localStr.store('audio_url', audio_url);
      this.localStr.store('member_project', member.project);
      this.localStr.store('member_jobno', member.jobno);
      this.localStr.store('offline', false);

      // TODO DELETE
      this.sessStr.store('logInTime', Date.now());
      this.sessStr.store('finishedTranscriptions', 0);
      this.sessStr.store('nextTranscription', 0);
      this.sessStr.store('transcriptionTime', {start: 0, end: 0});

      this.login = true;
      this.logged_in = true;

      return {error: ''};
    }

    return {error: ''};
  }

  /**
   * Sets member_id. Returns true on success, false on failure
   * @param member_id
   * @returns {boolean}
   */
  private setMemberID(member_id: string): boolean {
    this.user.id = member_id;
    return true;
  }

  public clearSession(): boolean {
    this.logged_in = false;
    this.login = false;

    this.sessStr.clear();

    return (isNullOrUndefined(this.sessStr.retrieve('session_key'))
      && isNullOrUndefined(this.sessStr.retrieve('member_id')));
  }

  public clearLocalStorage(): boolean {
    this.logged_in = false;
    this.login = false;

    const version = this._version;
    this.localStr.clear();
    this.localStr.store('version', version);

    return (isNullOrUndefined(this.sessStr.retrieve('data_id'))
      && isNullOrUndefined(this.sessStr.retrieve('audio_url')));
  }

  public save(key: string, value: any): boolean {
    if (key === 'annotation' || key === 'feedback') {
      this.saving.emit(true);
    }

    switch (key) {
      case 'annotation':
        this.overwriteAnnotation(value.levels).catch((err) => {
          console.error(err);
        });
        break;
      case 'feedback':
        this._idb.save('options', 'feedback', {value: value}).catch((err) => {
          console.error(err);
        });
        break;
      default:
        return false; // if key not found return false
    }

    if (key === 'annotation' || key === 'feedback') {
      this.saving.emit(false);
    }
    return true;
  }

  public saveLogItem(log: any) {
    if (!isNullOrUndefined(log)) {
      this._idb.save('logs', log.timestamp, log).then(() => {
        console.log('LOG SAVED');
      }).catch((err) => {
        console.error(err);
      })
    }
  }

  public beginLocalSession = (files: {
    status: string,
    file: File,
    checked_converters: number
  }[], keep_data: boolean, navigate: () => void, err: (error: string) => void) => {
    if (!isNullOrUndefined(files)) {
      // get audio file
      let audiofile;
      for (let i = 0; i < files.length; i++) {
        if (AudioManager.isValidFileName(files[i].file.name, AppInfo.audioformats)) {
          audiofile = files[i].file;
          break;
        }
      }

      if (!isNullOrUndefined(audiofile)) {

        if (!keep_data) {
          // delete old data from previous session
          console.error('clear session');
          this.clearSession();
          this.clearLocalStorage();
        }

        if (!isNullOrUndefined(this._user.id) && this._user.id !== '-1' && this._user.id !== '') {
          // last was online mode
          console.error('clear session m');
          this.clearSession();
          this.clearLocalStorage();
        }

        const res = this.setSessionData(null, null, null, true);
        if (res.error === '') {
          this._uselocalmode = true;
          this.sessionfile = this.getSessionFile(audiofile);

          this.file = audiofile;
          navigate();
        } else {
          err(res.error);
        }
      } else {
        err('type not supported');
      }
    }
  };

  public endSession(offline: boolean, navigate: () => void) {
    this.clearSession();
    navigate();
  }

  public getSessionFile = (file: File) => {
    return new SessionFile(
      file.name,
      file.size,
      file.lastModifiedDate,
      file.type
    );
  };

  /**
   * loads the option by its key and sets its variable.
   * Notice: the variable is defined by '_' before the key string
   * @param {string} key
   */
  private loadOptionFromIDB(key: string): Promise<any> {
    return new Promise<any>(
      (resolve, reject) => {
        if (!isNullOrUndefined(this._idb)) {
          if (typeof key === 'string') {
            this._idb.get('options', key).then(
              (result) => {
                resolve(result.value);
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

  public load(idb: IndexedDBManager): Promise<void> {
    this._idb = idb;
    console.log('in load function');

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
          attribute: '_audio_url',
          key: 'audio_url'
        },
        {
          attribute: '_comment',
          key: 'comment'
        },
        {
          attribute: '_data_id',
          key: 'data_id'
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
          attribute: '_uselocalmode',
          key: 'uselocalmode'
        },
        {
          attribute: '_user',
          key: 'user'
        }
      ]
    ).then(() => {
      idb.getAll('logs', 'timestamp').then((logs) => {
        this._logs = logs;
      });
    }).then(() => {
      idb.getAll('annotation', 'name').then((levels: OLevel[]) => {
        this._annotation = levels;
        console.log('feedback is');
        console.log(this._feedback);
      });
    });
  }

  private loadOptions = (variables: { attribute: string, key: string }[]): Promise<void> => {
    return new Promise<void>(
      (resolve, reject) => {
        const wrapper = (acc: number): Promise<any> => {
          if (acc < variables.length) {
            console.log(this);
            if (this['' + variables[acc].attribute + ''] !== undefined) {
              if (variables[acc].hasOwnProperty('attribute') && variables[acc].hasOwnProperty('key')) {
                return this.loadOptionFromIDB(variables[acc].key).then(
                  (result) => {
                    if (variables[acc].key === 'feedback') {
                      console.log('FFFFFFF ' + result);
                    }
                    this['' + variables[acc].attribute + ''] = result;
                    console.log(`RESULT OF ${variables[acc].attribute} is ${this['' + variables[acc].attribute + '']}`);
                    wrapper(++acc);
                  }
                )
              } else {
                reject(Error('loadOptions: variables parameter must be of type {attribute:string, key:string}[]'));
              }
            } else {
              reject(Error(`session service needs an attribute called \'${variables[acc].attribute}\'`))
            }
          } else {
            resolve();
          }
        };

        wrapper(0);
      }
    );
  };

  public clearIDBTable(name: string): Promise<void> {
    return this._idb.clear(name);
  }

  public overwriteAnnotation = (value: OLevel[]): Promise<void> => {
    return this.clearIDBTable('annotation')
      .then(() => {
        this._annotation = value;
      }).catch((err) => {
        console.error(err);
      }).then(() => {
        return this._idb.saveArraySync(value, 'annotation', 'name')
      });
  }
}
