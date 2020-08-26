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
        }).catch(resolve);
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
        console.error(Error('loadOptions: variables parameter must be of type {attribute:string, key:string}[]'));
      }
    }

    // return when all operations have been finished
    Promise.all(promises).then(
      (values) => {
        subject.next(values);
      },
      (error) => {
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
                idbm.save('options', 'version', {value: AppInfo.version}).catch((error) => {
                  console.error(error);
                });
                resolve(idbm);
              } else if (result.type === 'upgradeneeded') {
                // database opened and needs upgrade/installation
                console.log(`IDB needs upgrade from v${result.oldVersion} to v${result.newVersion}...`);
                const oldVersion = result.oldVersion;

                // foreach step to the latest version you need to define the uprade
                // procedure
                new Promise<void>((resolve2, reject2) => {
                  if (oldVersion === 2) {
                    const transaction = result.target.transaction;
                    const options = transaction.objectStore('options');

                    idbm.get(options, 'uselocalmode').then((entry) => {
                      if (!(entry === null || entry === undefined)) {
                        if (entry.value === false) {
                          idbm.save(options, 'useMode', {
                            name: 'useMode',
                            value: 'online'
                          }).catch((error) => {
                            console.error(error);
                          });
                        } else if (entry.value === true) {
                          idbm.save(options, 'useMode', {
                            name: 'useMode',
                            value: 'local'
                          }).catch((error) => {
                            console.error(error);
                          });
                        }
                      }
                    });
                    console.log(`updated to v3`);
                    resolve();
                  }
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
}
