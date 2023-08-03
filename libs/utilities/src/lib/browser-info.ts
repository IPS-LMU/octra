import * as platform from 'platform';

export class BrowserInfo {
  public static get platform(): 'mac' | 'pc' {
    if (platform?.os?.family && platform?.os?.family === 'OS X') {
      return 'mac';
    } else {
      return 'pc';
    }
  }

  public static get browser(): string | undefined {
    return platform ? platform.name : '';
  }

  public static get version(): string | undefined {
    return platform ? platform.version : '';
  }

  public static get os(): any {
    return !(platform === undefined) ? platform.os : undefined;
  }
}
