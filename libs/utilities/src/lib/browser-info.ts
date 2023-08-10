import * as platform from 'platform';

export class BrowserInfo {
  /**
   * returns if current system is mac or pc.
   */
  public static get platform(): 'mac' | 'pc' {
    if (platform?.os?.family && platform?.os?.family === 'OS X') {
      return 'mac';
    } else {
      return 'pc';
    }
  }

  /**
   * returns the browser name
   */
  public static get browser(): string | undefined {
    return platform ? platform.name : '';
  }

  /**
   * returns version
   */
  public static get version(): string | undefined {
    return platform ? platform.version : '';
  }

  /**
   * returns the running OS
   */
  public static get os(): any {
    return platform?.os;
  }
}
