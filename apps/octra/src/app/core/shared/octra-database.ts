import Dexie, { Transaction } from 'dexie';
import { IAnnotJSON } from '@octra/annotation';
import { LoginMode } from '../store';
import { from, map, of, Subject } from 'rxjs';
import { ProjectDto } from '@octra/api-types';

export class OctraDatabase extends Dexie {
  public demoData: Dexie.Table<IIDBEntry, string>;
  public onlineData: Dexie.Table<IIDBEntry, string>;
  public localData: Dexie.Table<IIDBEntry, string>;
  public options: Dexie.Table<IIDBEntry, string>;
  public onReady: Subject<void>;

  private defaultOptions: IIDBEntry[] = [
    {
      name: 'submitted',
      value: false,
    },
    {
      name: 'version',
      value: 3,
    },
    {
      name: 'easymode',
      value: false,
    },
    {
      name: 'audioURL',
      value: undefined,
    },
    {
      name: 'comment',
      value: '',
    },
    {
      name: 'dataID',
      value: undefined,
    },
    {
      name: 'feedback',
      value: undefined,
    },
    {
      name: 'language',
      value: undefined,
    },
    {
      name: 'sessionfile',
      value: undefined,
    },
    {
      name: 'usemode',
      value: undefined,
    },
    {
      name: 'user',
      value: undefined,
    },
    {
      name: 'interface',
      value: undefined,
    },
    {
      name: 'logging',
      value: true,
    },
    {
      name: 'showLoupe',
      value: false,
    },
    {
      name: 'prompttext',
      value: '',
    },
    {
      name: 'servercomment',
      value: '',
    },
    {
      name: 'secondsPerLine',
      value: 5,
    },
    {
      name: 'audioSettings',
      value: {
        volume: 1,
        speed: 1,
      },
    },
    {
      name: 'asr',
      value: undefined,
    },
    {
      name: 'highlightingEnabled',
      value: false,
    },
    {
      name: 'console',
      value: [],
    },
  ];

  //...other tables goes here...

  constructor(dbName: string) {
    super(dbName);
    this.onReady = new Subject<void>();

    this.version(0.2)
      .stores({
        annotation_levels: '++id',
        annotation_links: '++id',
        logs: 'timestamp',
        options: 'name',
      })
      .upgrade(this.upgradeToDatabaseV2);

    this.version(0.3)
      .stores({
        annotation_levels: '++id',
        annotation_links: '++id',
        logs: 'timestamp',
        options: 'name',
      })
      .upgrade(this.upgradeToDatabaseV3);

    this.version(0.4)
      .stores({
        annotation_levels: '++id',
        annotation_links: '++id',
        logs: 'timestamp',
        demo_data: 'name',
        online_data: 'name',
        local_data: 'name',
        options: 'name',
      })
      .upgrade(this.upgradeToDatabaseV4);

    this.demoData = this.table('demo_data');
    this.onlineData = this.table('online_data');
    this.localData = this.table('local_data');

    this.options = this.table('options');

    this.on('ready', () => {
      this.checkAndFillPopulation()
        .then(() => {
          this.onReady.next();
          this.onReady.complete();
        })
        .catch((error) => {
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
    return transaction
      .table('options')
      .toCollection()
      .modify((option: IIDBEntry) => {
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

  private async upgradeToDatabaseV4(transaction: Transaction) {
    console.log(`UPGRADE to v4`);
    await transaction.table('options').get('usemode');
  }

  private getTableFromString(mode: LoginMode): Dexie.Table<IIDBEntry, string> {
    let table: Dexie.Table<IIDBEntry, string> = undefined as any;

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
            this.populateModeOptions(this.localData),
          ])
            .then(() => {
              console.log(`population of options finished!`);
              resolve();
            })
            .catch((error) => {
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
      transcriptID: '-1',
      feedback: undefined,
      sessionfile: undefined,
      currentEditor: 'Dictaphone-Editor',
      logging: true,
    };

    return table.add({
      name: 'options',
      value: modeOptions,
    });
  }

  public saveModeData(mode: LoginMode, name: string, value: any) {
    const table = this.getTableFromString(mode);
    if (table) {
      return from(table.put({ name, value }, name)).pipe(
        map(() => {
          return;
        })
      );
    } else {
      return of();
    }
  }

  public clearDataOfMode(mode: LoginMode, name: string) {
    const table = this.getTableFromString(mode);
    if (table) {
      return from(
        table.put(
          {
            name: name,
            value: {},
          },
          name
        )
      ).pipe(
        map(() => {
          return;
        })
      );
    } else {
      return of();
    }
  }

  public loadDataOfMode<T>(mode: LoginMode, name: string, emptyValue: T) {
    const table = this.getTableFromString(mode);
    if (table) {
      return from(table.get(name)).pipe(
        map((result) => {
          if (result && result.value) {
            return result.value as T;
          } else {
            return emptyValue;
          }
        })
      );
    }
    return of(emptyValue);
  }

  private populateOptions() {
    return this.options.bulkPut([
      {
        name: 'version',
        value: 3,
      },
      {
        name: 'easymode',
        value: false,
      },
      {
        name: 'language',
        value: undefined,
      },
      {
        name: 'usemode',
        value: undefined,
      },
      {
        name: 'user',
        value: undefined,
      },
      {
        name: 'interface',
        value: undefined,
      },
      {
        name: 'showLoupe',
        value: false,
      },
      {
        name: 'secondsPerLine',
        value: 5,
      },
      {
        name: 'audioSettings',
        value: {
          volume: 1,
          speed: 1,
        },
      },
      {
        name: 'asr',
        value: undefined,
      },
      {
        name: 'highlightingEnabled',
        value: false,
      },
      {
        name: 'console',
        value: [],
      },
    ]);
  }
}

export interface IAnnotation extends IIDBEntry {
  value: IAnnotJSON;
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
  transcriptID?: string;
  feedback?: any;
  sessionfile?: any;
  currentEditor?: string;
  logging: boolean;
  project?: ProjectDto;
  comment?: string;
}

export const DefaultModeOptions: IIDBModeOptions = {
  submitted: false,
  logging: true,
};
