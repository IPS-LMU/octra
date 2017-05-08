import {Converter} from './shared/Converters/Converter';
import {TextConverter} from './shared/Converters/TextConverter';
import {AnnotJSONConverter} from './shared/Converters/AnnotJSONConverter';
import {PraatTableConverter} from './shared/Converters/PraatTableConverter';

export class AppInfo {
  static get converters(): Converter[] {
    return this._converters;
  }
  static get version(): string {
    return this._version;
  }

  private static _version = '1.2.0';

  private static _converters: Converter[] = [
    new TextConverter(),
    new PraatTableConverter(),
    new AnnotJSONConverter()
  ];
}
