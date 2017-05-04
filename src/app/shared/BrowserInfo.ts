export class BrowserInfo {
  public static get platform(): string {
    if (platform.os.family && platform.os.family === 'OS X') {
      return 'mac';
    } else {
      return 'pc';
    }
  }

  public static browser: string = platform.name;
  public static version: string = platform.version;
  public static os: any = platform.os;
}
