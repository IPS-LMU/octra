import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { Subject } from 'rxjs';

export class ConsoleLoggingServiceOptions {
  readonly confidentialList: string[] = [];
  readonly maxLogEntries = 100;

  ignore = (...args: any[]): boolean => {
    return false;
  };

  constructor(partial?: Partial<ConsoleLoggingServiceOptions>) {
    Object.assign(this, partial);
  }
}

export class ConsoleChangeEvent {
  console: (ConsoleEntry | ConsoleGroupEntry)[];

  constructor(partial?: Partial<ConsoleChangeEvent>) {
    Object.assign(this, partial);
  }
}

export enum ConsoleType {
  LOG,
  INFO,
  WARN,
  ERROR,
}

export interface ConsoleEntry {
  type: ConsoleType;
  timestamp: string;
  message: string;
}

export interface ConsoleGroupEntry {
  label: string;
  timestamp: string;
  entries: ConsoleEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class ConsoleLoggingService {
  public readonly consoleChange = new Subject<ConsoleChangeEvent>();

  private options: ConsoleLoggingServiceOptions;
  private startedGroup?: ConsoleGroupEntry;
  private _console: (ConsoleEntry | ConsoleGroupEntry)[] = [];

  get console(): (ConsoleEntry | ConsoleGroupEntry)[] {
    return this._console;
  }

  init(options?: ConsoleLoggingServiceOptions) {
    this.options = options ?? new ConsoleLoggingServiceOptions();

    const oldLog = window.console.log;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const serv = this;

    // tslint:disable-next-line:only-arrow-functions
    window.console.log = (...args) => {
      if (this.options.ignore(...args)) {
        return;
      }
      serv.addEntry(
        ConsoleType.LOG,
        this.censorMessage(args[0], this.options.confidentialList),
      );
      oldLog.apply(console, args);
    };

    // overwrite console.err
    const oldError = window.console.error;
    // tslint:disable-next-line:only-arrow-functions
    window.console.error = (...args) => {
      let error = args[0];
      const context = args[1];

      let debug = '';
      let stack: string | undefined = '';

      if (typeof error === 'string') {
        debug = error;

        if (
          error === 'ERROR' &&
          context !== undefined &&
          context.stack &&
          context.message
        ) {
          debug = this.censorMessage(
            context.message,
            this.options.confidentialList,
          );
          stack = this.censorMessage(
            context.stack,
            this.options.confidentialList,
          );
        }
      } else {
        if (error instanceof Error) {
          error = this.censorMessage(error, this.options.confidentialList);
          debug = error.message;
          stack = error.stack;
        } else {
          if (typeof error === 'object') {
            // some other type of object
            debug = 'OBJECT';
            stack = JSON.stringify(error);
          } else {
            debug = error;
          }
        }
      }

      if (debug !== '') {
        serv.addEntry(
          ConsoleType.ERROR,
          `${debug}${stack !== '' ? ' ' + stack : ''}`,
        );
      }

      oldError.apply(console, args);
    };

    // overwrite console.warn
    const oldWarn = window.console.warn;

    // tslint:disable-next-line:only-arrow-functions
    console.warn = (...args) => {
      if (this.options.ignore(...args)) {
        return;
      }

      serv.addEntry(
        ConsoleType.WARN,
        this.censorMessage(args[0], this.options.confidentialList),
      );
      oldWarn.apply(console, args);
    };

    // overwrite console.collapsedGroup
    const oldGroupCollapsed = window.console.groupCollapsed;
    (() => {
      // tslint:disable-next-line:only-arrow-functions
      console.groupCollapsed = function (...args) {
        serv.beginGroup(args[0]);
        oldGroupCollapsed.apply(console, args);
      };
    })();

    // overwrite console.groupEnd
    const oldGroupEnd = window.console.groupEnd;
    (() => {
      // tslint:disable-next-line:only-arrow-functions
      console.groupEnd = function (...args) {
        serv.endGroup();
        oldGroupEnd.apply(console, args);
      };
    })();
  }

  public addEntry(type: ConsoleType, message: any) {
    const consoleItem: ConsoleEntry = {
      type,
      timestamp: DateTime.now().toISO(),
      message,
    };

    if (this._console !== undefined) {
      if (!this.startedGroup) {
        this._console = [...this._console, consoleItem];
        if (this._console.length > this.options.maxLogEntries) {
          this._console.splice(
            0,
            this._console.length - this.options.maxLogEntries,
          );
        }
        this.consoleChange.next(
          new ConsoleChangeEvent({
            console: this._console,
          }),
        );
      } else {
        this.addToGroup(type, message);
      }
    }
  }

  public beginGroup(label: string) {
    this.startedGroup = {
      label,
      timestamp: DateTime.now().toISO(),
      entries: [],
    };
  }

  public addToGroup(type: ConsoleType, message: any) {
    this.startedGroup?.entries.push({
      type,
      timestamp: DateTime.now().toISO(),
      message,
    });
  }

  public endGroup() {
    if (this._console && this.startedGroup) {
      this._console = [...this._console, this.startedGroup];
      this.startedGroup = undefined;
      if (this._console.length > this.options.maxLogEntries) {
        this._console.splice(
          0,
          this._console.length - this.options.maxLogEntries,
        );
      }
      this.consoleChange.next(
        new ConsoleChangeEvent({
          console: this._console,
        }),
      );
    }
    this.startedGroup = undefined;
  }

  public clear() {
    this._console = [];
  }

  public addEntriesFromDB(entries: (ConsoleEntry | ConsoleGroupEntry)[]) {
    if (entries !== undefined && Array.isArray(entries) && entries.length > 0) {
      this._console = entries.concat(
        [
          {
            type: ConsoleType.INFO,
            timestamp: DateTime.now()
              .setLocale('de')
              .toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS),
            message: '--- AFTER RELOAD ---',
          },
        ],
        this._console,
      );
    }

    if (this._console.length > this.options.maxLogEntries) {
      this._console.splice(
        0,
        this._console.length - this.options.maxLogEntries,
      );
    }

    this.consoleChange.next(
      new ConsoleChangeEvent({
        console: this._console,
      }),
    );
  }

  private censorMessage<T>(obj: T, confidentialList?: string[]): T {
    if (confidentialList && confidentialList.length > 0) {
      if (typeof obj === 'string') {
        const regex = new RegExp(
          confidentialList.map((a) => `(?:${a})`).join('|'),
          'g',
        );
        const result = obj.replace(regex, '$1[CENSORED]$2');
        return result as T;
      } else {
        if (obj instanceof Error) {
          Object.assign(obj, {
            message: this.censorMessage(obj.message, confidentialList),
            stack: this.censorMessage(obj.stack, confidentialList),
          });
        }
      }
    }
    return obj;
  }
}
