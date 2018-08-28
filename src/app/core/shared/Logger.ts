export class Logger {
  private entries: any[];
  private group_name: string;

  constructor(groupe_name: string) {
    this.entries = [];
    this.group_name = groupe_name;
  }

  public static err(message: any) {
    console.error(Logger.getDateStr() + ': ' + message);
  }

  public static warn(message: any) {
    console.warn(Logger.getDateStr() + ': ' + message);
  }

  public static log(message: any) {
    if (typeof message !== 'object') {
      console.log(Logger.getDateStr() + ': ' + message);
    } else {
      console.log(message);
    }
  }

  public static getDateStr() {
    const date = new Date();
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  public addEntry(type: string, message: any) {
    this.entries.push(
      {
        type: type,
        message: message
      }
    );
  }

  public output() {
    console.groupCollapsed(this.group_name);
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      switch (entry.type) {
        case('log'):
          Logger.log(entry.message);
          break;
        case('err'):
          Logger.err(entry.message);
          break;
        case('warn'):
          Logger.warn(entry.message);
          break;
      }
    }
    console.groupEnd();
  }
}
