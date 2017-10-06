import {EventEmitter, Injectable} from '@angular/core';
import {LocalStorageService, SessionStorage, SessionStorageService} from 'ng2-webstorage';
import {SessionFile} from '../../obj/SessionFile';
import {isNullOrUndefined} from 'util';
import {OLevel, OLink} from '../../obj/Annotation/AnnotJSON';
import {AudioManager} from '../../obj/media/audio/AudioManager';
import {AppInfo} from '../../../app.info';
import {IndexedDBManager} from '../../obj/IndexedDBManager';

export interface IIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;
}

export interface IIDBLink {
  id: number;
  link: OLink;
}

export class OIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;

  constructor(id: number, level: OLevel, sortorder: number) {
    this.id = id;
    this.level = level;
    this.sortorder = sortorder;
  }
}

export class OIDBLink {
  id: number;
  link: OLink;

  constructor(id: number, link: OLink) {
    this.id = id;
    this.link = link;
  }
}

@Injectable()
export class AppStorageService {
  get logging(): boolean {
    return this._logging;
  }

  set logging(value: boolean) {
    this._logging = value;
    this._idb.save('options', 'logging', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get followplaycursor(): boolean {
    return this._followplaycursor;
  }

  set followplaycursor(value: boolean) {
    this._followplaycursor = value;
  }

  get annotation_links(): OIDBLink[] {
    return this._annotation_links;
  }

  get levelcounter(): number {
    return this._levelcounter;
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

  get annotation(): OIDBLevel[] {
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
    this.idb.save('options', 'easymode', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  set language(value: string) {
    this._language = value;
    this.idb.save('options', 'language', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get language(): string {
    return this._language;
  }

  get sessionfile(): SessionFile {
    return SessionFile.fromAny(this._sessionfile);
  }

  set sessionfile(value: SessionFile) {
    this._sessionfile = (!isNullOrUndefined(value)) ? value.toAny() : null;
    this.idb.save('options', 'sessionfile', {value: this._sessionfile})
      .catch((err) => {
        console.error(err);
      });
  }

  get uselocalmode(): boolean {
    return this._uselocalmode;
  }

  set uselocalmode(value: boolean) {
    this._uselocalmode = value;
    this.idb.save('options', 'uselocalmode', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get audio_url(): string {
    return this._audio_url;
  }

  set audio_url(value: string) {
    this._audio_url = value;
    this.idb.save('options', 'audio_url', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get data_id(): number {
    return this._data_id;
  }

  set data_id(value: number) {
    this._data_id = value;
    this.idb.save('options', 'data_id', {value: value}).catch((err) => {
      console.error(err);
    });
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
    this.idb.save('options', 'submitted', {value: value}).catch((err) => {
      console.error(err);
    });
  }

  get Interface(): string {
    return this._interface;
  }

  set Interface(new_interface: string) {
    this._interface = new_interface;
    this.idb.save('options', 'interface', {value: new_interface}).catch((err) => {
      console.error(err);
    });
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
    this._idb.save('options', 'user', {value: this._user}).catch((err) => {
      console.error(err);
    });
  }

  // SESSION STORAGE
  @SessionStorage('session_key') session_key: string;
  @SessionStorage() logged_in: boolean;
  @SessionStorage() logInTime: number; // timestamp

  @SessionStorage('agreement') private _agreement: any;
  @SessionStorage('jobs_left') jobs_left: number;
  @SessionStorage('playonhover') private _playonhover: boolean;
  @SessionStorage('followplaycursor') private _followplaycursor: boolean;
  @SessionStorage('reloaded') private _reloaded: boolean;
  @SessionStorage('email') private _email: string;
  @SessionStorage('servertranscript') private _servertranscipt: any[];

  // IDB STORAGE
  private _idbloaded = false;
  private _loaded = new EventEmitter();
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
  private _interface: string = null;
  private _logging = false;

  private _user: {
    id: string,
    project: string,
    jobno: number
  } = null;
  private _easymode = false;
  private _comment = '';
  private _annotation: OIDBLevel[] = null;
  private _annotation_links: OIDBLink[] = null;

  // is user on the login page?
  private login: boolean;

  public file: File;
  public saving: EventEmitter<string> = new EventEmitter<string>();
  private _levelcounter = 0;

  get LoggedIn(): boolean {
    return this.logged_in;
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
      this.uselocalmode = true;
      this.user = {
        id: '-1',
        project: '',
        jobno: -1
      };
      this.login = true;
      this.logged_in = true;

      return {error: ''};
    }

    if (!this.login && !offline && (!isNullOrUndefined(member))) {
      if (isNullOrUndefined(this._interface)) {
        this._interface = '2D-Editor';
      }
      this.setNewSessionKey();

      this.data_id = data_id;
      this.logged_in = true;
      this.sessStr.store('logged_in', this.logged_in);
      this.sessStr.store('interface', this._interface);
      this.audio_url = audio_url;
      this.user = {
        id: member.id,
        project: member.project,
        jobno: member.jobno
      };
      this.uselocalmode = false;

      this.login = true;
      return {error: ''};
    }

    return {error: ''};
  }

  public clearSession(): boolean {
    this.logged_in = false;
    this.login = false;

    this.sessStr.clear();

    return (isNullOrUndefined(this.sessStr.retrieve('session_key'))
      && isNullOrUndefined(this.sessStr.retrieve('member_id')));
  }

  public clearLocalStorage(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.logged_in = false;
      this.login = false;

      return this.clearAnnotationData()
        .then(() => {
            return this.idb.save('options', 'user', {value: null});
          }
        ).then(() => {
          this.idb.save('options', 'feedback', {value: null});
        }).then(() => {
          this.idb.save('options', 'comment', {value: ''});
        }).then(() => {
          this.idb.save('options', 'audio_url', {value: null});
        }).then(() => {
          this.idb.save('options', 'data_id', {value: null});
        }).then(() => {
          this.idb.save('options', 'sessionfile', {value: null});
        }).then(() => {
          return this.clearLoggingData();
        }).then(
          () => {
            resolve();
          }
        ).catch((err) => {
          reject(err);
        });
    });
  }

  public save(key: string, value: any): boolean {
    if (key === 'annotation' || key === 'feedback') {
      this.saving.emit('saving');
    }

    switch (key) {
      case 'annotation':
        this.changeAnnotationLevel(value.num, value.level).then(
          () => {
            this.saving.emit('success');
          }
        ).catch((err) => {
          this.saving.emit('error');
          console.error(err);
        });
        break;
      case 'feedback':
        this._idb.save('options', 'feedback', {value: value}).then(
          () => {
            this.saving.emit('success');
          }
        ).catch((err) => {
          this.saving.emit('error');
          console.error(err);
        });
        break;
      default:
        return false; // if key not found return false
    }

    return true;
  }

  public saveLogItem(log: any) {
    if (!isNullOrUndefined(log)) {
      this._idb.save('logs', log.timestamp, log).catch((err) => {
        console.error(err);
      });
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

      const process = () => {
        const res = this.setSessionData(null, null, null, true);
        if (res.error === '') {
          this._uselocalmode = true;
          this.sessionfile = this.getSessionFile(audiofile);
          this.file = audiofile;
          navigate();
        } else {
          err(res.error);
        }
      };

      if (!isNullOrUndefined(audiofile)) {
        if (!keep_data || (!isNullOrUndefined(this._user) &&
            !isNullOrUndefined(this._user.id) && this._user.id !== '-1' && this._user.id !== '')) {
          // last was online mode
          this.clearSession();
          this.clearLocalStorage().then(() => {
            process();
          });
        } else {
          process();
        }
      } else {
        err('type not supported');
      }
    }
  }

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
  }

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
                const res_obj = (!isNullOrUndefined(result)) ? result.value : null;
                resolve(res_obj);
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
        },
        {
          attribute: '_interface',
          key: 'interface'
        },
        {
          attribute: '_logging',
          key: 'logging'
        }
      ]
    ).then(() => {
      idb.getAll('logs', 'timestamp').then((logs) => {
        this._logs = logs;
      });
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
        this._annotation_links = [];
        for (let i = 0; i < links.length; i++) {
          if (!links[i].hasOwnProperty('id')) {
            this._annotation_links.push(
              new OIDBLink(i + 1, links[i].link)
            );
          } else {
            this._annotation_links.push(links[i]);
          }
        }
      });
    }).then(
      () => {
        this._loaded.complete();
      }
    );
  }

  private loadOptions = (variables: { attribute: string, key: string }[]): Promise<void> => {
    return new Promise<void>(
      (resolve, reject) => {
        const wrapper = (acc: number): Promise<any> => {
          if (acc < variables.length) {
            if (this['' + variables[acc].attribute + ''] !== undefined) {
              if (variables[acc].hasOwnProperty('attribute') && variables[acc].hasOwnProperty('key')) {
                return this.loadOptionFromIDB(variables[acc].key).then(
                  (result) => {
                    if (!isNullOrUndefined(result)) {
                      this['' + variables[acc].attribute + ''] = result;
                    }
                    wrapper(++acc);
                  }
                );
              } else {
                reject(Error('loadOptions: variables parameter must be of type {attribute:string, key:string}[]'));
              }
            } else {
              reject(Error(`session service needs an attribute called \'${variables[acc].attribute}\'`));
            }
          } else {
            resolve();
          }
        };

        wrapper(0);
      }
    );
  }

  private clearIDBTable(name: string): Promise<void> {
    return this._idb.clear(name);
  }

  public clearAnnotationData(): Promise<void> {
    this._annotation = null;
    return this.clearIDBTable('annotation_levels').then(
      () => {
        return this.clearIDBTable('annotation_links');
      });
  }

  public changeAnnotationLevel(tiernum: number, level: OLevel): Promise<void> {
    if (!isNullOrUndefined(level)) {
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
  }

  public addAnnotationLevel(level: OLevel): Promise<void> {
    if (!isNullOrUndefined(level)) {
      this._annotation.push({
        id: ++this._levelcounter,
        level: level,
        sortorder: this._annotation.length
      });
      return this.idb.save('annotation_levels', this._levelcounter, {
        id: this._levelcounter,
        level: level
      });
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error('level is undefined or null'));
      });
    }
  }

  public removeAnnotationLevel(num: number, id: number): Promise<void> {
    if (!isNullOrUndefined(name) && num < this._annotation.length) {
      return this.idb.remove('annotation_levels', id).then(
        () => {
          this._annotation.splice(num, 1);
        }
      );
    } else {
      return new Promise((resolve, reject) => {
        reject(new Error('level is undefined or null'));
      });
    }
  }

  public overwriteAnnotation = (value: OIDBLevel[]): Promise<void> => {
    return this.clearAnnotationData()
      .then(() => {
        this._annotation = value;
      }).catch((err) => {
        console.error(err);
      }).then(() => {
        return this._idb.saveArraySequential(value, 'annotation_levels', 'id').then(
          () => {
            let max = 0;

            for (let i = 0; i < value.length; i++) {
              max = Math.max(max, value[i].id);
            }
            this._levelcounter = max;
          }
        );
      });
  }

  public overwriteLinks = (value: OIDBLink[]): Promise<void> => {
    return this.clearIDBTable('annotation_links')
      .then(() => {
        this._annotation_links = value;
      }).catch((err) => {
        console.error(err);
      }).then(() => {
        return this._idb.saveArraySequential(value, 'annotation_links', 'id');
      });
  };

  public clearLoggingData(): Promise<void> {
    this._logs = null;
    return this.clearIDBTable('logs');
  }

  public getLevelByID(id: number) {
    for (let i = 0; i < this._annotation.length; i++) {
      if (this._annotation[i].id === id) {
        return this._annotation[i];
      }
    }
    return null;
  }

}
