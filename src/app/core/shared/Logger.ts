export class Logger {
  private readonly entries: any[];
  private readonly group_name: string;

  constructor(groupe_name: string) {
    this.entries = [];
    this.group_name = groupe_name;
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
          console.log(entry.message);
          break;
        case('err'):
          console.error(entry.message);
          break;
        case('warn'):
          console.warn(entry.message);
          break;
      }
    }
    console.groupEnd();
  }
}
