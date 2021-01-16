import {Injectable} from '@angular/core';
import {ConsoleEntry} from './bug-report.service';
import {OIDBLevel, OIDBLink} from '@octra/annotation';
import {Subject} from 'rxjs';
import {IIDBLevel, IIDBLink, IOption, OctraDatabase} from '../octra-database';
import {isUnset} from '@octra/utilities';


@Injectable({
  providedIn: 'root'
})
export class IDBService {
  private _isReady = false;
  private _isOpened = false;

  private database: OctraDatabase;

  public get isReady(): boolean {
    return this._isReady;
  }

  constructor() {
  }

  /**
   * call this function after appSettings were loaded.
   * @param dbName
   */
  public initialize(dbName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.database = new OctraDatabase(dbName);
      this.database.onReady.subscribe(() => {
        this._isReady = true;

        if (this._isOpened) {
          resolve();
        }
      });

      this.database.open().then(() => {
        this._isOpened = true;

        if (this._isReady) {
          resolve();
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * clears all annotaiton data
   */
  public clearAnnotationData(): Promise<any> {
    return this.clearIDBTable('annotation_levels').then(
      () => {
        return this.clearIDBTable('annotation_links');
      });
  }

  /**
   * clears all options
   */
  public clearOptions(): Promise<any> {
    return this.clearIDBTable('options');
  }

  /**
   * loads console entries.
   */
  public loadConsoleEntries(): Promise<ConsoleEntry[]> {
    return new Promise<ConsoleEntry[]>((resolve, reject) => {
      this.database.options.get('console').then((entry) => {
        if (!isUnset(entry)) {
          resolve(entry.value as ConsoleEntry[]);
        } else {
          resolve([]);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * saves console entries.
   * @param entries
   */
  public saveConsoleEntries(entries: ConsoleEntry[]) {
    return this.database.options.put({
      name: 'console',
      value: entries
    });
  }

  /**
   * load options
   * @param variables
   */
  public loadOptions = (variables: { attribute: string, key: string }[]): Subject<IOption[]> => {
    const subject = new Subject<{
      value: any;
      name: string;
    }[]>();

    const keys = variables.map(a => a.key);
    this.database.options.bulkGet(keys).then((values) => {
      subject.next(values.filter(a => !isUnset(a)));
    }).catch((error) => {
      console.error(error);
      subject.error(error);
    });

    return subject;
  }

  /**
   * load all logs
   */
  public loadLogs() {
    return new Promise<any[]>((resolve, reject) => {
      const logs: any[] = [];

      this.database.logs.each((item) => {
        if (!isUnset(item)) {
          logs.push(item.value);
        }
      }).then(() => {
        resolve(logs);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * load one annotation level
   */
  public loadAnnotationLevels() {
    return new Promise<IIDBLevel[]>((resolve, reject) => {
      const levels: IIDBLevel[] = [];

      this.database.annotation_levels.each((item) => {
        if (!isUnset(item)) {
          levels.push(item.value)
        }
      }).then(() => {
        resolve(levels);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * load all annotaiton links
   */
  public loadAnnotationLinks() {
    return new Promise<IIDBLink[]>((resolve, reject) => {
      const links: IIDBLink[] = [];

      this.database.annotation_links.each((item) => {
        if (!isUnset(item)) {
          links.push(item);
        }
      }).then(() => {
        resolve(links);
      }).catch((error) => {
        reject(error);
      });
    });
  }

  /**
   * save option
   * @param key
   * @param value
   */
  public saveOption(key: string, value: any) {
    if (this.isReady) {
      return this.database.options.put({name: key, value}, key);
    } else {
      console.error(new Error(`can't save option ${key}, because idb is not ready.`));
    }
  }

  /**
   * save one log item.
   * @param log
   * @param timestamp
   */
  public saveLog(log: any, timestamp: number) {
    return this.database.logs.put(log, timestamp);
  }

  /**
   * save all logs
   * @param logs
   */
  public saveLogs(logs: any[]) {
    return this.database.logs.bulkPut(logs);
  }

  /**
   * save one annotation level.
   * @param level
   * @param id
   */
  public saveAnnotationLevel(level: IIDBLevel, id: number) {
    return this.database.annotation_levels.put({
      id,
      value: level
    }, id);
  }

  /**
   * saves all annotation levels.
   * @param levels
   */
  public saveAnnotationLevels(levels: OIDBLevel[]) {
    return this.database.annotation_levels.bulkPut(levels.map(a => {
      return {
        id: a.id,
        value: a
      }
    }));
  }

  /**
   * saves one annotation link
   * @param link
   */
  public saveAnnotationLink(link: OIDBLink) {
    return this.database.annotation_links.put(link, link.id);
  }

  /**
   * saves all annotation links
   * @param links
   */
  public saveAnnotationLinks(links: OIDBLink[]) {
    return this.database.annotation_links.bulkPut(links);
  }

  /**
   * clears selected IDB Table
   * @param name
   */
  public clearIDBTable(name: string): Promise<any> {
    return this.database[name].clear();
  }

  /**
   * clears logging data
   */
  public clearLoggingData(): Promise<any> {
    return this.clearIDBTable('logs');
  }

  /**
   * removes one item from table
   * @param tableName
   * @param key
   */
  public remove(tableName: string, key: string | number) {
    return this.database[tableName].delete(key);
  }
}
