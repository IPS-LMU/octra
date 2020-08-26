import {Observable} from 'rxjs';
import {isUnset} from '@octra/utilities';

export enum IDBMode {
  READONLY,
  READWRITE
}

export class IndexedDBManager {

  private indexedDB: IDBFactory;
  private idbkeyrange: IDBKeyRange;
  private readonly dbname: string;
  private readonly _idbtransaction: IDBTransaction;

  get idbtransaction(): IDBTransaction {
    return this._idbtransaction;
  }

  private _db: IDBDatabase;

  get db(): IDBDatabase {
    return this._db;
  }

  constructor(dbname: string) {
    this.dbname = dbname;

    if (!IndexedDBManager.isCompatible()) {
      console.error('Browser doesn\'t support a stable version of IndexedDB.');
    } else {
      this.indexedDB = (window as any).indexedDB
        || (window as any).mozIndexedDB
        || (window as any).webkitIndexedDB
        || (window as any).msIndexedDB;

      this._idbtransaction = (window as any).IDBTransaction
        || (window as any).webkitIDBTransaction
        || (window as any).msIDBTransaction;

      this.idbkeyrange = (window as any).IDBKeyRange
        || (window as any).webkitIDBKeyRange
        || (window as any).msIDBKeyRange;
    }
  }

  /***
   * checks if browser supports indexedDB
   */
  public static isCompatible(): boolean {
    const indexedDB = (window as any).indexedDB
      || (window as any).mozIndexedDB
      || (window as any).webkitIndexedDB
      || (window as any).msIndexedDB;

    const idbtransaction = (window as any).IDBTransaction
      || (window as any).webkitIDBTransaction
      || (window as any).msIDBTransaction;

    const idbkeyrange = (window as any).IDBKeyRange
      || (window as any).webkitIDBKeyRange
      || (window as any).msIDBKeyRange;

    return (!(isUnset(indexedDB) || isUnset(idbtransaction) || isUnset(idbkeyrange)));
  }

  public get = (storeName: string | IDBObjectStore, key: string | number): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        this.getStore(storeName, IDBMode.READONLY).then((store) => {
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
        }).catch((error) => {
          reject(error);
        });
      }
    );
  }

  public getAll = (storeName: string | IDBObjectStore, key: string | number): Promise<any[]> => {
    return new Promise<any>(
      (resolve, reject) => {
        const result = [];
        this.getStore(storeName, IDBMode.READONLY).then((store) => {
          if (key !== null && key !== undefined) {
            const cursorRequest = store.openCursor();

            cursorRequest.onsuccess = (event: any) => {
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
        }).catch((error) => {
          reject(error);
        });
      }
    );
  }

  private getStore(store: string | IDBObjectStore, mode: IDBMode): Promise<IDBObjectStore> {
    return new Promise<any>((resolve, reject) => {
      if ((typeof store !== 'string')) {
        resolve(store);
      } else {
        this.getObjectStore(store, mode).then((storeIDB) => {
          resolve(storeIDB)
        }).catch((error) => {
          reject(error);
        });
      }
    })
  }

  public save = (storeName: string | IDBObjectStore, key, data): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        this.getStore(storeName, IDBMode.READWRITE).then((store) => {
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
        }).catch((error) => {
          console.error(error);
        });
        if (data === null || data === undefined) {
          data = {};
        }
      }
    );
  }

  public saveSequential = (storeName: string | IDBObjectStore, data: { key: string, value: any }[]): Promise<void> => {
    return new Promise<void>((resolve, reject) => {

        const wrapper = (acc: number) => {
          if (acc < data.length) {
            if (data[acc].hasOwnProperty('key') && data[acc].hasOwnProperty('value')) {
              return this.save(storeName, data[acc].key, data[acc].value).then(wrapper(++acc));
            } else {
              reject(new Error('saveSync data parameter has invalid elements'));
            }
          } else {
            resolve();
          }
        };

        return wrapper(0);
      }
    );
  }

  public remove = (storeName: string | IDBObjectStore, key: string | number): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        this.getStore(storeName, IDBMode.READWRITE).then((store) => {
          const request = store.delete(key);
          request.onsuccess = (result: any) => {
            resolve(result);
          };

          request.onerror = (error: any) => {
            reject(error);
          };
        }).catch((error) => {
          reject(error);
        });
      });
  }

  public clear = (storeName: string | IDBObjectStore): Promise<any> => {
    return new Promise<any>(
      (resolve, reject) => {
        this.getStore(storeName, IDBMode.READWRITE).then((store) => {
          const request = store.clear();
          request.onsuccess = (result: any) => {
            resolve(result);
          };

          request.onerror = (error: any) => {
            reject(error);
          };
        }).catch((error) => {
          reject(error);
        });
      });
  }

  public close = () => {
    this.db.close();
  }

  public saveArraySequential = (array: any[], storeName: string | IDBObjectStore, key: any): Promise<void> => {
    return new Promise<void>(
      (resolve, reject) => {
        this.getStore(storeName, IDBMode.READWRITE).then((store) => {
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
        }).catch((error) => {
          console.error(error);
        });
      }
    );
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

  private getObjectStore = (storeName: string, mode: IDBMode): Promise<IDBObjectStore> => {
    return new Promise<IDBObjectStore>((resolve, reject) => {
      let modeStr: IDBTransactionMode = 'readonly';

      if (mode === IDBMode.READWRITE) {
        modeStr = 'readwrite';
      }
      const txn = this.db.transaction([storeName], modeStr);
      txn.onerror = (error) => {
        reject(error);
      }
      resolve(txn.objectStore(storeName));
    });
  }
}
