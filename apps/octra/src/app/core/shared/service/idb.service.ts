import {Injectable} from '@angular/core';
import {ConsoleEntry} from './bug-report.service';
import {isUnset} from '@octra/utilities';
import * as fromTranscriptionActions from '../../store/transcription/transcription.actions';
import {IndexedDBManager} from '../../obj/IndexedDBManager';
import {IIDBLink, OIDBLevel, OIDBLink} from '@octra/annotation';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IDBService {
  private idb: IndexedDBManager;

  constructor() {
  }

  public initialize(dbName: string) {
    this.idb = new IndexedDBManager(dbName);
  }

  public load(): Promise<void> {
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
    return this.idb.save('options', key, {value}).catch((err) => {
      console.error(err);
    });
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
}
