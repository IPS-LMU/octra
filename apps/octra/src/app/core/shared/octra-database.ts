import Dexie, {Transaction} from 'dexie';
import {Subject} from 'rxjs';
import {OLevel, OLink} from '@octra/annotation';

export class OctraDatabase extends Dexie {
  public annotation_levels: Dexie.Table<IAnnotationLevel, number>;
  public annotation_links: Dexie.Table<IIDBLink, number>;
  public logs: Dexie.Table<any, number>;
  public options: Dexie.Table<IOption, string>;
  public onReady: Subject<void>;

  private defaultOptions: IOption[] = [
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

    this.annotation_levels = this.table('annotation_levels');
    this.annotation_links = this.table('annotation_links');
    this.logs = this.table('logs');
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
    return transaction.table('options').toCollection().modify((option: IOption) => {
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

  private checkAndFillPopulation(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.options.count((count) => {
        if (count === 0) {
          this.populateOptions().then(() => {
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

  private populateOptions() {
    return this.options.bulkPut([
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
    ]);
  }
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

export interface IOption {
  name: string;
  value: any;
}
