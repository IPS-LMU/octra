import { IAnnotJSON, ILevel, ILink, OAnnotJSON } from '@octra/annotation';
import { ProjectDto } from '@octra/api-types';
import { removeEmptyProperties } from '@octra/utilities';
import Dexie, { Transaction } from 'dexie';
import 'dexie-export-import';
import { firstValueFrom, from, map, Observable, of, Subject } from 'rxjs';
import { LoginMode } from '../store';
import { ASRStateSettings } from '../store/asr';

export class OctraDatabase extends Dexie {
  public demoData!: Dexie.Table<IIDBEntry, string>;
  public onlineData!: Dexie.Table<IIDBEntry, string>;
  public urlData!: Dexie.Table<IIDBEntry, string>;
  public localData!: Dexie.Table<IIDBEntry, string>;
  public app_options!: Dexie.Table<IIDBEntry, string>;
  public onReady: Subject<void>;

  //...other tables goes here...

  constructor(dbName: string) {
    super(dbName);
    this.onReady = new Subject<void>();
  }

  public async init() {
    let currentVersion = 0;

    try {
      const db = await this.open();
      currentVersion = db.verno;
      db.close();
    } catch (error: any) {
      // ignore
    }

    if (currentVersion > 0 && currentVersion < 0.4) {
      await this.backupCurrentDatabase();
    }

    this.version(0.2)
      .stores({
        annotation_levels: 'id',
        annotation_links: 'id',
        logs: 'timestamp',
        options: 'name, value',
      })
      .upgrade(this.upgradeToDatabaseV2);

    this.version(0.3)
      .stores({
        annotation_levels: 'id',
        annotation_links: 'id',
        logs: 'timestamp',
        options: 'name, value',
      })
      .upgrade(this.upgradeToDatabaseV3);

    // INTRODUCTION OF OCTRA 2
    this.version(0.4)
      .stores({
        annotation_levels: 'id',
        annotation_links: 'id',
        logs: 'timestamp',
        options: 'name, value',
        demo_data: '&name, value',
        online_data: '&name, value',
        local_data: '&name, value',
        url_data: '&name, value',
        app_options: '&name, value',
      })
      .upgrade(this.upgradeToDatabaseV4);

    this.version(0.5)
      .stores({
        annotation_levels: null,
        annotation_links: null,
        logs: null,
        options: null,
        demo_data: '&name, value',
        online_data: '&name, value',
        local_data: '&name, value',
        url_data: '&name, value',
        app_options: '&name, value',
      })
      .upgrade(this.upgradeToDatabaseV5);

    this.demoData = this.table('demo_data');
    this.onlineData = this.table('online_data');
    this.localData = this.table('local_data');
    this.urlData = this.table('url_data');

    this.app_options = this.table('app_options');

    await this.open();
    try {
      await this.checkAndFillPopulation();
      this.onReady.next();
      this.onReady.complete();
    } catch (e) {
      this.onReady.error(e);
    }
  }

  private upgradeToDatabaseV2(transaction: Transaction) {
    console.log('upgrade to V2');
    return transaction.table('options').bulkPut([
      {
        name: 'submitted',
        value: false,
      },
      {
        name: 'version',
        value: 3,
      },
      {
        name: 'easyMode',
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
        name: 'showMagnifier',
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
    ]);
  }

  private async upgradeToDatabaseV3(transaction: Transaction) {
    console.log('upgrade to V3');
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

  private async upgradeToDatabaseV4(tr: Transaction) {
    console.log('Upgrade to V4...');

    console.log('-> Copy all new options to app_options table...');
    const optionKeys = [
      'accessCode',
      'audioSettings',
      'easymode',
      'interface',
      'logging',
      'maus',
      'secondsPerLine',
      'sessionfile',
      'showFeedbackNotice',
      'showLoupe',
      'usemode',
      'user',
      'userProfile',
      'version',
    ];
    const options = (await tr.table('options').bulkGet(optionKeys)).filter(
      (a) => a !== undefined
    );

    console.log(`-> Migrate ${options.length} options from v3 to v4...`);

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      if (option.name === 'audioSettings') {
        await tr.table('app_options').put(option);
      } else if (option.name === 'easymode') {
        await tr.table('app_options').put({
          name: 'easyMode',
          value: option.value,
        });
      } else if (option.name === 'interface') {
        await tr.table('app_options').put(option);
      } else if (option.name === 'secondsPerLine') {
        await tr.table('app_options').put(option);
      } else if (option.name === 'showFeedbackNotice') {
        await tr.table('app_options').put(option);
      } else if (option.name === 'showLoupe') {
        await tr.table('app_options').put({
          name: 'showMagnifier',
          value: option.value,
        });
      } else if (option.name === 'usemode') {
        await tr.table('app_options').put(option);
      } else if (option.name === 'userProfile') {
        await tr.table('app_options').put(option);
      } else if (option.name === 'version') {
        await tr.table('app_options').put({
          name: 'version',
          value: '2.0.0',
        });
      }
    }

    console.log('-> Migrate ASR settings to v4...');
    const oldASRSettings:
      | {
          name: 'asr';
          value: {
            selectedLanguage: string;
            selectedService: string;
          };
        }
      | undefined = options.find((a) => a.name === 'asr');
    const oldAccessCode:
      | {
          name: 'accessCode';
          value: string;
        }
      | undefined = options.find((a) => a.name === 'accessCode');
    const oldMausSettings:
      | {
          name: 'maus';
          value: {
            selectedLanguage: string;
            selectedCode: string;
          };
        }
      | undefined = options.find((a) => a.name === 'maus');

    const newASRSettings: {
      selectedMausLanguage?: string;
      selectedASRLanguage?: string;
      selectedServiceProvider?: string;
      accessCode?: string;
    } = {
      selectedASRLanguage: oldASRSettings?.value?.selectedLanguage,
      accessCode: oldAccessCode?.value,
      selectedMausLanguage: oldMausSettings?.value?.selectedCode,
      selectedServiceProvider: oldASRSettings?.value?.selectedService,
    };
    await tr.table('app_options').put({
      name: 'asr',
      value: newASRSettings,
    });

    // if usemode is local, copy all data to new tables for online mode
    // before v4 only one active mode with data was valid. So we only need to check for local mode
    const usemode = (await tr.table('options').get('usemode'))?.value;
    if (usemode === 'local') {
      console.log('-> usemode is local.');

      console.log('-> Migrate Local mode settings to v4...');
      const oldSessionFile:
        | {
            name: 'sessionfile';
            value: {
              name: string;
              type: string;
              size: number;
            };
          }
        | undefined = await tr.table('options').get('sessionfile');
      const oldLogging: { name: 'logging'; value: boolean } | undefined =
        await tr.table('options').get('logging');
      const newLocalModeOptions: IIDBModeOptions = {
        sessionfile: oldSessionFile?.value,
        logging: oldLogging?.value,
      };
      await tr.table('local_data').put({
        name: 'options',
        value: newLocalModeOptions,
      });

      console.log('-> Migrate annotation data of local mode to v4...');
      const oldAnnotationLevels:
        | {
            id: number;
            level: ILevel;
          }[]
        | undefined = await tr.table('annotation_levels').toArray();
      const oldAnnotationLinks:
        | {
            id: number;
            link: ILink;
          }[]
        | undefined = await tr.table('annotation_links').toArray();

      if (
        oldSessionFile?.value?.name &&
        ((oldAnnotationLevels && oldAnnotationLevels.length > 0) ||
          (oldAnnotationLinks && oldAnnotationLinks.length > 0))
      ) {
        const audioFileName = oldSessionFile.value.name;
        const newAnnotation: OAnnotJSON | undefined =
          !oldSessionFile?.value?.name ||
          (!oldAnnotationLevels && !oldAnnotationLinks)
            ? undefined
            : new OAnnotJSON(
                audioFileName,
                audioFileName.replace(/\.wav$/g, ''),
                -1,
                oldAnnotationLevels?.map((a) => a.level),
                oldAnnotationLinks?.map((a) => a.link)
              );
        await tr.table('local_data').put({
          name: 'annotation',
          value: newAnnotation,
        });

        console.log('-> Migrate logs to v4...');
        let oldLogs = await tr.table('logs').toArray();
        oldLogs.sort((a, b) => {
          if (a.timestamp > b.timestamp) {
            return 1;
          }
          return a.timestamp < b.timestamp ? -1 : 0;
        });

        if (oldLogs.length > 0) {
          const firstTimeStamp = oldLogs[0].timestamp;
          oldLogs = oldLogs.map((a) => ({
            ...a,
            timestamp: a.timestamp - firstTimeStamp,
          }));
        }

        await tr.table('local_data').put({
          name: 'logs',
          value: oldLogs,
        });

        console.log('-> Migration to v4 successful.');
      }
    }
  }

  private async upgradeToDatabaseV5(transaction: Transaction) {
    console.log('upgrade to V5');
  }

  private async backupCurrentDatabase() {
    await this.open();
    const backup = await this.export({ prettyJson: true });
    const backupFile = new File(
      [await backup.arrayBuffer()],
      `${this.name}.json`,
      {
        type: 'application/json',
      }
    );
    console.log(`BACKUP URL: ${URL.createObjectURL(backupFile)}`);
    this.close();
    const dexie = await Dexie.import(backup, {
      name: `${this.name}_backup_${Date.now()}`,
    });
    await dexie.open();
    dexie.close();
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
      case LoginMode.URL:
        table = this.urlData;
        break;
    }

    return table;
  }

  private async checkAndFillPopulation(): Promise<void> {
    const subj = new Subject<void>();
    let optionsLength = (await this.app_options.toArray())?.length ?? 0;
    if (optionsLength === 0) {
      this.populateOptions();
    }

    optionsLength =
      (await this.demoData.get('options'))?.value === undefined ? 0 : 1;
    if (optionsLength === 0) {
      await firstValueFrom(this.populateModeOptions(LoginMode.DEMO));
    }
    optionsLength =
      (await this.onlineData.get('options'))?.value === undefined ? 0 : 1;
    if (optionsLength === 0) {
      await firstValueFrom(this.populateModeOptions(LoginMode.ONLINE));
    }
    optionsLength =
      (await this.localData.get('options'))?.value === undefined ? 0 : 1;
    if (optionsLength === 0) {
      await firstValueFrom(this.populateModeOptions(LoginMode.LOCAL));
    }
    optionsLength =
      (await this.urlData.get('options'))?.value === undefined ? 0 : 1;
    if (optionsLength === 0) {
      await firstValueFrom(this.populateModeOptions(LoginMode.URL));
    }
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
          name: 'easyMode',
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
          name: 'userProfile',
          value: undefined,
        },
        {
          name: 'interface',
          value: undefined,
        },
        {
          name: 'showMagnifier',
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
  showMagnifier?: boolean | null;
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
  | 'showMagnifier'
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
