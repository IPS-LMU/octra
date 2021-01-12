declare var platform: any;

export class BrowserInfo {
  public static get platform(): 'mac' | 'pc' {
    if (platform.os.family && platform.os.family === 'OS X') {
      return 'mac';
    } else {
      return 'pc';
    }
  }

  public static get browser(): string {
    return (!(platform === null || platform === undefined)) ? platform.name : '';
  }

  public static get version(): string {
    return (!(platform === null || platform === undefined)) ? platform.version : '';
  }

  public static get os(): any {
    return (!(platform === null || platform === undefined)) ? platform.os : null;
  }
}
