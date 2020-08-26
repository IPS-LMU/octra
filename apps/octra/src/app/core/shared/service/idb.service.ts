import {Injectable} from '@angular/core';
import {ConsoleEntry} from './bug-report.service';
import {isUnset} from '@octra/utilities';
import * as TranscriptionActions from '../../store/transcription/transcription.actions';
import {IndexedDBManager} from '../../obj/IndexedDBManager';
import {OIDBLevel, OIDBLink} from '@octra/annotation';
import {Subject} from 'rxjs';
import {Store} from '@ngrx/store';
import {AppInfo} from '../../../app.info';

@Injectable({
  providedIn: 'root'
})
export class IDBService {
  private idb: IndexedDBManager;
  private _isReady = false;

  public get isReady(): boolean {
    return this._isReady;
  }

  constructor(private store: Store) {
  }

  public initialize(dbName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      new Promise<string>((resolve2, reject2) => {
        this.loadOptionFromIDB('version').then((result) => {
          resolve2(result.value);
        }).catch(() => {
          resolve2(undefined);
        });
      }).then((dbVersion) => {
        this.checkForUpdates(dbName, dbVersion).then((newIDB) => {
          this.idb = newIDB;
          this._isReady = true;
          resolve();
        }).catch((error) => {
          reject(error);
        });
      });
    });
  }

  public clearAnnotationData(): Promise<any> {
    this.store.dispatch(TranscriptionActions.clearAnnotation());
    return this.clearIDBTable('annotation_levels').then(
      () => {
        return this.clearIDBTable('annotation_links');
      });
  }

  public clearOptions(): Promise<any> {
    return this.clearIDBTable('options');
  }

  public loadConsoleEntries(): Promise<ConsoleEntry[]> {
    return new Promise<ConsoleEntry[]>((resolve, reject) => {
      this.idb.get('options', 'console').then((entries) => {
        resolve(entries as ConsoleEntry[]);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public saveConsoleEntries(entries: ConsoleEntry[]) {
    return this.idb.save('options', 'console', {value: entries}).catch((err) => {
      console.error(err);
    });
  }

  public loadOptions = (variables: { attribute: string, key: string }[]): Subject<{
    value: any;
    name: string;
  }[]> => {
    const subject = new Subject<{
      value: any;
      name: string;
    }[]>();

    const promises: Promise<{
      name: string;
      value: any;
    }>[] = [];
    for (const variable of variables) {
      if (variable.hasOwnProperty('attribute') && variable.hasOwnProperty('key')) {
        promises.push(this.loadOptionFromIDB(variable.key));
      } else {
        console.error(new Error('loadOptions: variables parameter must be of type {attribute:string, key:string}[]'));
      }
    }

    // return when all operations have been finished
    Promise.all(promises).then(
      (values) => {
        subject.next(values);
      },
      (error) => {
        console.error(error);
        subject.error(error);
      }
    );

    return subject;
  }

  public loadLogs() {
    return this.idb.getAll('logs', 'timestamp');
  }

  public loadAnnotationLevels() {
    return this.idb.getAll('annotation_levels', 'id');
  }

  public loadAnnotationLinks() {
    return this.idb.getAll('annotation_links', 'id');
  }

  /**
   * loads the option by its key and sets its variable.
   * Notice: the variable is defined by '_' before the key string
   */
  private loadOptionFromIDB(key: string): Promise<{
    name: string;
    value: any;
  }> {
    return new Promise<{
      name: string;
      value: any;
    }>(
      (resolve, reject) => {
        if (!isUnset(this.idb)) {
          if (typeof key === 'string') {
            this.idb.get('options', key).then(
              (result) => {
                resolve({
                    name: key,
                    value: (!isUnset(result)) ? result.value : null
                  }
                );
              }
            ).catch((err) => {
              console.error(err);
              reject(err);
            });
          } else {
            console.error('loadOptionFromIDB: method needs key of type string');
            reject(new Error('loadOptionFromIDB: method needs key of type string'));
          }
        } else {
          console.error('loadOptionFromIDB: idb is null');
          reject(new Error('loadOptionFromIDB: idb is null'));
        }
      }
    );
  }

  public save(tableName: string, key: string | number, value: any) {
    return this.idb.save(tableName, key, {value}).catch((err) => {
      console.error(err);
    });
  }

  public saveOption(key: string, value: any) {
    if (this.isReady) {
      return this.idb.save('options', key, {value}).catch((err) => {
        console.error(err);
      });
    } else {
      return new Promise<void>((resolve, reject) => {
        console.error(new Error(`can't save option ${key}, because idb is not ready.`));
        reject(new Error(`can't save option ${key}, because idb is not ready.`));
      });
    }
  }

  public saveLogs(logs: any[]) {
    return this.idb.saveArraySequential(logs, 'logs', 'timestamp').catch((err) => {
      console.error(err);
    });
  }

  public saveAnnotationLevels(levels: OIDBLevel[]) {
    return this.idb.saveArraySequential(levels, 'annotation_levels', 'id').catch((err) => {
      console.error(err);
    });
  }

  public saveAnnotationLinks(links: OIDBLink[]) {
    return this.idb.saveArraySequential(links, 'annotation_links', 'id').catch((err) => {
      console.error(err);
    });
  }

  public clearIDBTable(name: string): Promise<any> {
    if (isUnset(this.idb)) {
      return new Promise<any>((resolve) => {
        resolve();
      });
    }
    return this.idb.clear(name);
  }

  public clearLoggingData(): Promise<any> {
    return this.clearIDBTable('logs');
  }


  public checkForUpdates(dbname: string, dbVersion: string): Promise<IndexedDBManager> {
    return new Promise<IndexedDBManager>(
      (resolve, reject) => {
        const appversion = AppInfo.version;

        const continueCheck = () => {
          if (isUnset(dbVersion)) {
            console.log('update...');
            console.log(appversion);
            console.log(dbVersion);
          }

          // incremental IDB upgrade: It is very important to make sure, that the database can
          // be upgrade from any version to the latest version
          const idbm = new IndexedDBManager(dbname);
          idbm.open(3).subscribe(
            (result) => {
              console.log('open db');
              console.log(result.type);

              if (result.type === 'success') {
                // database opened
                console.log('IDB opened');
                idbm.save('options', 'version', {value: 3}).catch((error) => {
                  console.error(error);
                });
                resolve(idbm);
              } else if (result.type === 'upgradeneeded') {
                // database opened and needs upgrade/installation
                console.log(`IDB needs upgrade from v${result.oldVersion} to v${result.newVersion}...`);
                let oldVersion = result.oldVersion;

                // foreach step to the latest version you need to define the uprade
                // procedure
                this.doUpgradeToV2(oldVersion, idbm).then(() => {
                  oldVersion = 2;
                  this.doUpgradeToV3(oldVersion, result.target.transaction, idbm).then(() => {
                    oldVersion = 3;
                    console.log(`continue...`);
                    console.log(idbm);
                  }).catch((error) => {
                    reject(error);
                  });
                }).catch((error) => {
                  reject(error);
                });
              }
            },
            (error) => {
              reject(error);
            });
        };

        // check if version entry in IDB exists
        const idb = new IndexedDBManager(dbname);
        idb.open().subscribe(
          () => {
            // database opened
            console.log('get version');
            idb.get('options', 'version').then((version) => {
              if (version !== null && version.hasOwnProperty('value')) {
                dbVersion = version.value;
                idb.close();
                continueCheck();
              }
            }).catch(() => {
              console.log('version empty');
              idb.close();
              continueCheck();
            });
          },
          (err) => {
            // IDB does not exist
            continueCheck();
          }
        )
      }
    );
  }

  private doUpgradeToV2(oldVersion: number, idbm: IndexedDBManager) {
    console.log(`upgrade from ${oldVersion} to 2...`);
    const optionsStore = idbm.db.createObjectStore('options', {keyPath: 'name'});
    const logsStore = idbm.db.createObjectStore('logs', {keyPath: 'timestamp'});
    const annoLevelsStore = idbm.db.createObjectStore('annotation_levels', {keyPath: 'id'});
    const annoLinksStore = idbm.db.createObjectStore('annotation_links', {keyPath: 'id'});

    // options for version 1
    return idbm.saveSequential(optionsStore, [
      {
        key: 'easymode',
        value: {value: false}
      },
      {
        key: 'submitted',
        value: {value: false}
      },
      {
        key: 'feedback',
        value: {value: null}
      },
      {
        key: 'dataID',
        value: {value: null}
      },
      {
        key: 'audioURL',
        value: {value: null}
      },
      {
        key: 'usemode',
        value: {value: null}
      },
      {
        key: 'interface',
        value: {value: '2D-Editor'}
      },
      {
        key: 'sessionfile',
        value: {value: null}
      },
      {
        key: 'language',
        value: {value: 'en'}
      },
      {
        key: 'version',
        value: {value: 1}
      },
      {
        key: 'comment',
        value: {value: ''}
      },
      {
        key: 'user',
        value: {
          value: {
            id: '',
            project: '',
            jobno: -1
          }
        }
      }
    ]);
  }

  private doUpgradeToV3(oldVersion: number, transaction: IDBTransaction, idbm: IndexedDBManager) {
    return new Promise<void>((resolve, reject) => {
      if (oldVersion === 2) {
        console.log(`upgrade from ${oldVersion} to 3...`);
        const options = transaction.objectStore('options');

        idbm.get(options, 'uselocalmode').then((entry) => {
          if (!(entry === null || entry === undefined)) {
            if (entry.value === false) {
              idbm.save(options, 'usemode', {
                name: 'usemode',
                value: 'online'
              }).catch((error) => {
                console.error(error);
              });
            } else if (entry.value === true) {
              idbm.save(options, 'usemode', {
                name: 'usemode',
                value: 'local'
              }).catch((error) => {
                console.error(error);
              });
            }
          }
          console.log(`updated to v3`);
          resolve();
        }).catch((error) => {
          console.error(error);
          resolve();
        })
      } else {
        resolve();
      }
    });
  }
}
