import { Injectable } from '@angular/core';
import { ConsoleEntry } from './bug-report.service';
import {
  DefaultModeOptions,
  IIDBModeOptions,
  OctraDatabase,
} from '../octra-database';
import { LoginMode } from '../../store';
import { IAnnotJSON, OAnnotJSON } from '@octra/annotation';
import { from, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IDBService {
  private _isReady = false;
  private _isOpened = false;

  private database!: OctraDatabase;

  public get isReady(): boolean {
    return this._isReady;
  }

  /**
   * call this function after appSettings were loaded.
   * @param dbName
   */
  public initialize(dbName: string): Observable<void> {
    this.database = new OctraDatabase(dbName);
    return from(this.database.open()).pipe(
      map((a) => {
        this._isReady = true;
        this._isOpened = true;
      })
    );
  }

  /**
   * clears all annotaiton data
   */
  public clearAnnotationData(mode: LoginMode) {
    return this.database.clearDataOfMode(mode, 'annotation');
  }

  /**
   * clears all options
   */
  public clearModeOptions(mode: LoginMode) {
    return this.database.clearDataOfMode(mode, 'options');
  }

  /**
   * clears all options
   */
  public clearOptions(mode: LoginMode): Promise<any> {
    return this.database.options.clear();
  }

  /**
   * loads console entries.
   */
  public loadConsoleEntries(): Promise<ConsoleEntry[]> {
    return new Promise<ConsoleEntry[]>((resolve, reject) => {
      this.database.options
        .get('console')
        .then((entry) => {
          if (entry !== undefined) {
            resolve(entry.value as ConsoleEntry[]);
          } else {
            resolve([]);
          }
        })
        .catch((error) => {
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
      value: entries,
    });
  }

  /**
   * load options
   */
  public loadOptions(keys: string[]): Observable<{
    version?: string;
    easymode?: boolean;
    language?: string;
    usemode?: any;
    user?: string;
    showLoupe?: boolean;
    secondsPerLine?: number;
    audioSettings?: {
      volume: number;
      speed: number;
    };
    highlightingEnabled?: boolean;
    playOnHofer?: boolean;
    asr?: {
      selectedLanguage?: string;
      selectedService?: string;
      selectedMausLanguage?: string;
    };
  }> {
    return from(this.database.options.bulkGet(keys)).pipe(
      map((values) => {
        const entries = values.filter((a) => a !== undefined);
        const result: any = {};

        for (const entry of entries) {
          result[entry!.name] = entry!.value;
        }
        return result;
      })
    );
  }

  /**
   * load all logs
   */
  public loadLogs(mode: LoginMode) {
    return this.database.loadDataOfMode<any[]>(mode, 'logs', []);
  }

  /**
   * load annotation
   */
  public loadAnnotation(mode: LoginMode) {
    return this.database.loadDataOfMode<IAnnotJSON>(
      mode,
      'annotation',
      undefined as any
    );
  }

  /**
   * save option
   * @param key
   * @param value
   */
  public saveOption<T>(key: string, value: T) {
    if (this.isReady) {
      return from(this.database.options.put({ name: key, value }, key)).pipe(
        map((result: string) => result)
      );
    } else {
      return throwError(() => {
        return new Error(`can't save option ${key}, because idb is not ready.`);
      });
    }
  }

  public saveModeOptions(mode: LoginMode, options: IIDBModeOptions) {
    return this.database.saveModeData(mode, 'options', options);
  }

  public loadModeOptions(mode: LoginMode): Observable<IIDBModeOptions> {
    return this.database.loadDataOfMode<IIDBModeOptions>(
      mode,
      'options',
      DefaultModeOptions
    );
  }

  /**
   * save one log item.
   */
  public saveLogs(mode: LoginMode, logs: any[]) {
    return this.database.saveModeData(mode, 'logs', logs);
  }

  /**
   * save one annotation level.
   */
  public saveAnnotation(mode: LoginMode, annotation: OAnnotJSON) {
    return this.database.saveModeData(mode, 'annotation', annotation);
  }

  /**
   * clears logging data
   */
  public clearLoggingData(mode: LoginMode) {
    return this.database.clearDataOfMode(mode, 'logs');
  }

  /**
   * removes one item from table
   * @param tableName
   * @param key
   */
  public remove(tableName: string, key: string | number) {
    (this.database as any)[tableName].delete(key);
    return;
  }
}
