import {isNullOrUndefined} from 'util';
import {Observable} from 'rxjs/Observable';

export enum IDBMode {
  READONLY,
  READWRITE
}

export class IndexedDBManager {
  get db(): IDBDatabase {
    return this._db;
  }

  get idbtransaction(): IDBTransaction {
    return this._idbtransaction;
  }

  private indexedDB: IDBFactory;
  private _idbtransaction: IDBTransaction;
  private idbkeyrange: IDBKeyRange;
  private _db: IDBDatabase;
  private dbname: string;


  /***
   * checks if browser supports indexedDB
   * @returns {boolean}
   */
  public static isCompatible(): boolean {
    const indexedDB = (<any> window).indexedDB
      || (<any> window).mozIndexedDB
      || (<any> window).webkitIndexedDB
      || (<any> window).msIndexedDB;

    const idbtransaction = (<any> window).IDBTransaction
      || (<any> window).webkitIDBTransaction
      || (<any> window).msIDBTransaction;

    const idbkeyrange = (<any> window).IDBKeyRange
      || (<any> window).webkitIDBKeyRange
      || (<any> window).msIDBKeyRange;

    return (!(isNullOrUndefined(indexedDB) || isNullOrUndefined(idbtransaction) || isNullOrUndefined(idbkeyrange)));
  }

  constructor(dbname: string) {
    this.dbname = dbname;

    if (!IndexedDBManager.isCompatible()) {
      console.error('Browser doesn\'t support a stable version of IndexedDB.');
    } else {
      this.indexedDB = (<any> window).indexedDB
        || (<any> window).mozIndexedDB
        || (<any> window).webkitIndexedDB
        || (<any> window).msIndexedDB;

      this._idbtransaction = (<any> window).IDBTransaction
        || (<any> window).webkitIDBTransaction
        || (<any> window).msIDBTransaction;

      this.idbkeyrange = (<any> window).IDBKeyRange
        || (<any> window).webkitIDBKeyRange
        || (<any> window).msIDBKeyRange;
    }
  }

  public open(version?: number): Observable<any> {
    const request = this.indexedDB.open(this.dbname, version);
    return Observable.create(observer => {
      request.onerror = (event: any) => {
        observer.error(event);
      };

      request.onsuccess = (event: any) => {
        this._db = event.target.result;
        observer.next(event);
        observer.complete();
      };

      request.onupgradeneeded = (event: any) => {
        this._db = event.target.result;
        observer.next(event);
      };

      request.onblocked = (event: any) => {
        observer.next(event);
      };
    });
  }

  private getObjectStore = (store_name: string, mode: IDBMode): IDBObjectStore => {
    let mode_str: IDBTransactionMode = 'readonly';

    if (mode === IDBMode.READWRITE) {
      mode_str = 'readwrite';
    }
    const txn = this.db.transaction([store_name], mode_str);
    return txn.objectStore(store_name);
  };

  public get = (store_name: string | IDBObjectStore, key: string | number): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        const store = (typeof store_name !== 'string') ? store_name : this.getObjectStore(store_name, IDBMode.READONLY);
        if (key !== null && key !== undefined) {
          const request: IDBRequest = store.get(key);
          request.onsuccess = (idbrequest: any) => {
            resolve(idbrequest.target.result);
          };

          request.onerror = (error: any) => {
            reject(error);
          };
        } else {
          reject(new Error('key not defined'));
        }
      }
    );
  };

  public getAll = (store_name: string | IDBObjectStore, key: string | number): Promise<any[]> => {
    return new Promise<any>(
      (resolve, reject) => {
        const result = [];
        const store = (typeof store_name !== 'string') ? store_name : this.getObjectStore(store_name, IDBMode.READONLY);
        if (key !== null && key !== undefined) {
          const cursorRequest = store.openCursor();

          cursorRequest.onsuccess = function (event: any) {
            const cursor = event.target.result;

            if (cursor) {
              const value = cursor.value;
              result.push(value);
              cursor.continue();
            } else {
              resolve(result);
            }
          };

          cursorRequest.onerror = (error: any) => {
            reject(error);
          };
        } else {
          reject(new Error('key not defined'));
        }
      }
    );
  };

  public save = (store_name: string | IDBObjectStore, key, data): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        const store = (typeof store_name !== 'string') ? store_name : this.getObjectStore(store_name, IDBMode.READWRITE);

        if (data === null || data === undefined) {
          data = {};
        }
        // make sure that key is in data object
        if (!data.hasOwnProperty(store.keyPath)) {
          data['' + store.keyPath + ''] = key;
        }
        const request = key ? store.put(data) : store.add(data);
        request.onsuccess = (result: any) => {
          resolve(result);
        };
        request.onerror = (error: any) => {
          reject(error);
        };
      }
    );
  };

  public saveSequential = (store_name: string | IDBObjectStore, data: { key: string, value: any }[]): Promise<void> => {
    return new Promise<void>((resolve, reject) => {

        const wrapper = (acc: number) => {
          if (acc < data.length) {
            if (data[acc].hasOwnProperty('key') && data[acc].hasOwnProperty('value')) {
              return this.save(store_name, data[acc].key, data[acc].value).then(wrapper(++acc));
            } else {
              reject(new Error('saveSync data parameter has invalid elements'));
            }
          } else {
            resolve();
          }
        };

        wrapper(0);
      }
    );
  };

  public remove = (store_name: string | IDBObjectStore, key: string | number): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        const store = (typeof store_name !== 'string') ? store_name : this.getObjectStore(store_name, IDBMode.READWRITE);
        const request = store.delete(key);
        request.onsuccess = (result: any) => {
          resolve(result);
        };

        request.onerror = (error: any) => {
          reject(error);
        };
      });
  };

  public clear = (store_name: string | IDBObjectStore): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        const store = (typeof store_name !== 'string') ? store_name : this.getObjectStore(store_name, IDBMode.READWRITE);
        const request = store.clear();
        request.onsuccess = (result: any) => {
          resolve(result);
        };

        request.onerror = (error: any) => {
          reject(error);
        };
      });
  };

  public close = () => {
    this.db.close();
  };

  public saveArraySequential = (array: any[], store_name: string | IDBObjectStore, key: any): Promise<void> => {
    return new Promise<void>(
      (resolve, reject) => {
        const store = (typeof store_name !== 'string') ? store_name : this.getObjectStore(store_name, IDBMode.READWRITE);

        const wrapper = (acc: number) => {
          if (acc < array.length) {
            const value = (typeof key === 'string') ? array[acc]['' + key + ''] : array[acc][key];
            this.save(store, value, array[acc]).then(
              () => {
                wrapper(++acc);
              }
            ).catch((err) => {
              reject(err);
            });
          } else {
            resolve();
          }
        };
        wrapper(0);
      }
    );
  }
}
