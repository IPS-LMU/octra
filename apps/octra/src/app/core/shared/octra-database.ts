import Dexie, {Transaction} from 'dexie';
import {Subject} from 'rxjs';
import {OLevel, OLink} from '@octra/annotation';
import {isUnset} from '@octra/utilities';
import {LoginMode} from '../store';

export class OctraDatabase extends Dexie {
  public demoData: Dexie.Table<IIDBEntry, string>;
  public onlineData: Dexie.Table<IIDBEntry, string>;
  public localData: Dexie.Table<IIDBEntry, string>;
  public options: Dexie.Table<IIDBOption, string>;
  public onReady: Subject<void>;

  private defaultOptions: IIDBOption[] = [
    {
      name: 'submitted',
      value: false
    },
    {
      name: 'version',
      value: 3
    },
    {
      name: 'easymode',
      value: false
    },
    {
      name: 'audioURL',
      value: null
    },
    {
      name: 'comment',
      value: ''
    },
    {
      name: 'dataID',
      value: null
    },
    {
      name: 'feedback',
      value: null
    },
    {
      name: 'language',
      value: null
    },
    {
      name: 'sessionfile',
      value: null
    },
    {
      name: 'usemode',
      value: null
    },
    {
      name: 'user',
      value: null
    },
    {
      name: 'interface',
      value: null
    },
    {
      name: 'logging',
      value: true
    },
    {
      name: 'showLoupe',
      value: false
    },
    {
      name: 'prompttext',
      value: ''
    },
    {
      name: 'servercomment',
      value: ''
    },
    {
      name: 'secondsPerLine',
      value: 5
    },
    {
      name: 'audioSettings',
      value: {
        volume: 1,
        speed: 1
      }
    },
    {
      name: 'asr',
      value: null
    },
    {
      name: 'highlightingEnabled',
      value: false
    },
    {
      name: 'console',
      value: []
    }
  ]

  //...other tables goes here...

  constructor(dbName: string) {
    super(dbName);
    this.onReady = new Subject<void>();

    this.version(0.2).stores({
      annotation_levels: '++id',
      annotation_links: '++id',
      logs: 'timestamp',
      options: 'name'
    }).upgrade(this.upgradeToDatabaseV2);

    this.version(0.3).stores({
      annotation_levels: '++id',
      annotation_links: '++id',
      logs: 'timestamp',
      options: 'name'
    }).upgrade(this.upgradeToDatabaseV3);

    this.version(0.4).stores({
      annotation_levels: '++id',
      annotation_links: '++id',
      logs: 'timestamp',
      demo_data: 'name',
      online_data: 'name',
      local_data: 'name',
      options: 'name'
    }).upgrade(this.upgradeToDatabaseV4);

    this.demoData = this.table('demo_data');
    this.onlineData = this.table('online_data');
    this.localData = this.table('local_data');

    this.options = this.table('options');

    this.on('ready', () => {
      this.checkAndFillPopulation().then(() => {
        this.onReady.next();
        this.onReady.complete();
      }).catch((error) => {
        this.onReady.error(error);
      });
    });
  }

  private upgradeToDatabaseV2(transaction: Transaction) {
    console.log(`UPGRADE to v2`);
    return transaction.table('options').bulkPut(this.defaultOptions);
  }

  private upgradeToDatabaseV3(transaction: Transaction) {
    console.log(`UPGRADE to v3`);
    return transaction.table('options').toCollection().modify((option: IIDBOption) => {
      if (option.name === 'uselocalmode') {
        option.name = 'usemode';
        if (option.value === false) {
          option.value = 'online';
        } else if (option.value === true) {
          option.value = 'local';
        }
      }
    });
  }


  private upgradeToDatabaseV4(transaction: Transaction) {
    console.log(`UPGRADE to v4`);

    return new Promise<void>((resolve, reject) => {
      transaction.table('options').get('usemode').then((usemode) => {
        if (usemode === 'local') {
          // TODO db: migrate old local data to localData, remove old tables
          resolve();
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  loadModeOptionsFromDB(mode: LoginMode) {
    return new Promise<IIDBModeOptions>((resolve, reject) => {
      const table = this.getTableFromString(mode);

      if (table) {
        return table.get('options').then((options) => {
          if (!isUnset(options)) {
            resolve(options.value)
          }
          resolve(null);
        }).catch((e) => {
          reject(e);
        });
      }
    });
  }

  loadModeLogsFromDB(mode: LoginMode) {
    return new Promise<any[]>((resolve, reject) => {
      const table = this.getTableFromString(mode);

      if (table) {
        return table.get('logs').then((logs) => {
          if (!isUnset(logs)) {
            resolve(logs.value)
          }
          resolve([]);
        }).catch((e) => {
          reject(e);
        });
      }
    });
  }

  private getTableFromString(mode: LoginMode): Dexie.Table<IIDBEntry, string> {
    let table: Dexie.Table<IIDBEntry, string> = null;

    switch (mode) {
      case LoginMode.DEMO:
        table = this.demoData;
        break;
      case LoginMode.LOCAL:
        table = this.localData;
        break;
      case LoginMode.ONLINE:
        table = this.onlineData;
        break;
    }

    return table;
  }

  private checkAndFillPopulation(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.options.count((count) => {
        if (count === 0) {
          Promise.all([
            this.populateOptions(),
            this.populateModeOptions(this.demoData),
            this.populateModeOptions(this.onlineData),
            this.populateModeOptions(this.localData)
          ]).then(() => {
            console.log(`population of options finished!`);
            resolve();
          }).catch((error) => {
            reject(error);
          });
        } else {
          resolve();
        }
      });
    });
  }

  private populateModeOptions(table: Dexie.Table<IIDBEntry, string>) {
    const modeOptions: IIDBModeOptions = {
      submitted: false,
      audioURL: '',
      comment: '',
      dataID: -1,
      feedback: null,
      sessionfile: null,
      prompttext: '',
      servercomment: '',
      logging: true
    };

    return table.add({
      name: 'options',
      value: modeOptions
    });
  }

  public saveModeData(mode: LoginMode, name: string, value: any) {
    return new Promise<void>((resolve, reject) => {
      const table = this.getTableFromString(mode);
      if (table) {
        table.put({name, value}, name).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      } else {
        resolve();
      }
    });
  }

  public clearDataOfMode(mode: LoginMode, name: string) {
    return new Promise<void>((resolve, reject) => {
      const table = this.getTableFromString(mode);
      if (table) {
        table.put({
          name: name,
          value: {}
        }, name).then(() => {
          resolve();
        }).catch((error) => {
          reject(error);
        });
      } else {
        resolve();
      }
    });
  }

  public loadDataOfMode<T>(mode: LoginMode, name: string, emptyValue: T) {
    return new Promise<T>((resolve, reject) => {
      const table = this.getTableFromString(mode);
      if (table) {
        table.get(name).then((result) => {
          if (result && result.value) {
            resolve(result.value as T);
          } else {
            resolve(emptyValue);
          }
        }).catch((error) => {
          reject(error);
        });
      } else {
        resolve(emptyValue);
      }
    });
  }

  private populateOptions() {
    return this.options.bulkPut([
      {
        name: 'version',
        value: 3
      },
      {
        name: 'easymode',
        value: false
      },
      {
        name: 'language',
        value: null
      },
      {
        name: 'usemode',
        value: null
      },
      {
        name: 'user',
        value: null
      },
      {
        name: 'interface',
        value: null
      },
      {
        name: 'showLoupe',
        value: false
      },
      {
        name: 'secondsPerLine',
        value: 5
      },
      {
        name: 'audioSettings',
        value: {
          volume: 1,
          speed: 1
        }
      },
      {
        name: 'asr',
        value: null
      },
      {
        name: 'highlightingEnabled',
        value: false
      },
      {
        name: 'console',
        value: []
      }
    ]);
  }
}

export interface IAnnotation {
  levels: IAnnotationLevel[];
  links: IIDBLink
}

export interface IAnnotationLevel {
  id: number,
  value: IIDBLevel
}

export interface IIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;
}

export interface IIDBLink {
  id: number;
  link: OLink;
}

export interface IIDBEntry {
  name: string;
  value: any;
}

export interface IIDBLogs extends IIDBEntry {
  value: any[];
}

export interface IIDBModeOptions {
  submitted: boolean;
  audioURL: string;
  comment: string;
  dataID: number;
  feedback: any;
  sessionfile: any;
  prompttext: string;
  servercomment: string;
  logging: boolean;
}

export interface IIDBOption {
  name: string;
  value: any;
}

