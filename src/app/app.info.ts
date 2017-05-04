export class AppInfo {
  static get version(): string {
    return this._version;
  }

  private static _version = '1.1.1';
}
