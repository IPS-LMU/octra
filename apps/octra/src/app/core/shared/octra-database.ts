import Dexie, { Transaction } from 'dexie';
import 'dexie-export-import';
import { IAnnotJSON } from '@octra/annotation';
import { LoginMode } from '../store';
import { forkJoin, from, map, Observable, of, Subject, take } from 'rxjs';
import { ProjectDto } from '@octra/api-types';
import { removeEmptyProperties } from '@octra/utilities';
import { ASRStateSettings } from '../store/asr';

export class OctraDatabase extends Dexie {
  public demoData!: Dexie.Table<IIDBEntry, string>;
  public onlineData!: Dexie.Table<IIDBEntry, string>;
  public urlData!: Dexie.Table<IIDBEntry, string>;
  public localData!: Dexie.Table<IIDBEntry, string>;
  public app_options!: Dexie.Table<IIDBEntry, string>;
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

    this.init();
  }

  private init() {
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
        annotation_levels: null,
        annotation_links: null,
        logs: null,
        options: null,
        demo_data: 'name',
        online_data: 'name',
        local_data: 'name',
        url_data: 'name',
        app_options: 'name',
      })
      .upgrade(this.upgradeToDatabaseV4);

    this.version(0.5)
      .stores({
        annotation_levels: null,
        annotation_links: null,
        logs: null,
        options: null,
        demo_data: 'name',
        online_data: 'name',
        local_data: 'name',
        url_data: 'name',
        app_options: 'name',
      })
      .upgrade(this.upgradeToDatabaseV5);

    this.demoData = this.table('demo_data');
    this.onlineData = this.table('online_data');
    this.localData = this.table('local_data');
    this.urlData = this.table('url_data');

    this.app_options = this.table('app_options');

    this.on('ready', () => {
      this.checkAndFillPopulation()
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.onReady.next();
            this.onReady.complete();
          },
          error: (error) => {
            this.onReady.error(error);
          },
        });
    });
  }

  private upgradeToDatabaseV2(transaction: Transaction) {
    console.log('upgrade to V2');
    return transaction.table('app_options').bulkPut(this.defaultOptions);
  }

  private upgradeToDatabaseV3(transaction: Transaction) {
    console.log('upgrade to V3');
    return transaction
      .table('app_options')
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

  private async upgradeToDatabaseV4(transaction: Transaction) {}

  private async upgradeToDatabaseV5(transaction: Transaction) {}

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
      case LoginMode.URL:
        table = this.urlData;
        break;
    }

    return table;
  }

  private checkAndFillPopulation(): Observable<void> {
    const subj = new Subject<void>();

    this.countEntries(this.app_options)
      .pipe(take(1))
      .subscribe({
        next: (count) => {
          if (count === 0) {
            forkJoin([
              this.populateOptions(),
              this.populateModeOptions(LoginMode.DEMO),
              this.populateModeOptions(LoginMode.ONLINE),
              this.populateModeOptions(LoginMode.LOCAL),
              this.populateModeOptions(LoginMode.URL),
            ]).subscribe(() => {
              subj.next();
              subj.complete();
            });
          } else {
            subj.next();
            subj.complete();
          }
        },
      });

    return subj;
  }

  private countEntries(
    table: Dexie.Table<IIDBEntry, string>
  ): Observable<number> {
    return from(
      new Promise<number>((resolve, reject) => {
        table
          .count()
          .then((count) => {
            resolve(count);
          })
          .catch(() => {
            reject();
          });
      })
    );
  }

  private populateModeOptions(mode: LoginMode) {
    const modeOptions: IIDBModeOptions = {
      currentEditor: '2D-Editor',
      logging: true,
    };

    return this.saveModeData(mode, 'options', modeOptions, true);
  }

  public saveModeData(
    mode: LoginMode,
    name: string,
    value: any,
    overwrite = false
  ) {
    const table = this.getTableFromString(mode);

    if (!table) {
      console.error(`table ${table} not found!`);
    }

    if (table) {
      let prepared =
        typeof value === 'object' && value !== undefined && value !== null
          ? JSON.parse(JSON.stringify(value))
          : value;
      prepared = removeEmptyProperties(prepared, {
        removeNull: false,
        removeEmptyStrings: false,
        removeUndefined: true,
      });
      // write undefined or null
      if (overwrite) {
        return from(
          table.put(
            {
              name,
              value: prepared,
            },
            name
          )
        ).pipe(
          map(() => {
            return;
          })
        );
      } else {
        return from(
          table.update(name, {
            value: prepared,
          })
        ).pipe(
          map(() => {
            return;
          })
        );
      }
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
            value: null,
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

  public clear() {
    return this;
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
    return from(
      this.app_options.bulkPut([
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
      ])
    );
  }

  exportDatabase() {
    return this.export({
      prettyJson: true,
    });
  }

  importDatabase(file: File) {
    return this.import(file, {
      clearTablesBeforeImport: true,
    });
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
  transcriptID?: string | null;
  feedback?: any;
  sessionfile?: any;
  importConverter?: string;
  currentEditor?: string | null;
  currentLevel?: number | null;
  logging?: boolean | null;
  project?: ProjectDto | null;
  comment?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface IIDBApplicationOptions {
  asr?: ASRStateSettings | null;
  audioSettings?: {
    volume: number;
    speed: number;
  } | null;
  console?: any[] | null;
  easyMode?: boolean | null;
  highlightingEnabled?: boolean | null;
  interface?: string | null;
  language?: string | null;
  secondsPerLine?: number | null;
  showLoupe?: boolean | null;
  useMode?: LoginMode | null;
  version?: number | null;
  editorFont?: string | null;
  playOnHover?: boolean | null;
  followPlayCursor?: boolean | null;
  showFeedbackNotice?: boolean | null;
  userProfile?: {
    name: string;
    email: string;
  } | null;
}

export type IDBApplicationOptionName =
  | 'asr'
  | 'audioSettings'
  | 'console'
  | 'easyMode'
  | 'highlightingEnabled'
  | 'interface'
  | 'language'
  | 'secondsPerLine'
  | 'showLoupe'
  | 'useMode'
  | 'userProfile'
  | 'version'
  | 'editorFont'
  | 'playOnHover'
  | 'followPlayCursor'
  | 'showFeedbackNotice';

export const DefaultModeOptions: IIDBModeOptions = {
  logging: true,
};
