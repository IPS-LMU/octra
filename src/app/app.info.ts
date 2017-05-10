import {Converter} from './shared/Converters/Converter';
import {TextConverter} from './shared/Converters/TextConverter';
import {AnnotJSONConverter} from './shared/Converters/AnnotJSONConverter';
import {PraatTableConverter} from './shared/Converters/PraatTableConverter';
import {CTMConverter} from './shared/Converters/CTMConverter';

export class AppInfo {
  public static get converters(): {
    appendix: string,
    converter: Converter
  }[] {
    return this._converters;
  }

  static get version(): string {
    return this._version;
  }

  private static _version = '1.2.0';

  private static _converters: {
    appendix: string,
    converter: Converter
  }[] = [
    {
      appendix: '.txt',
      converter: new TextConverter()
    },
    {
      appendix: '.Table',
      converter: new PraatTableConverter()
    },
    {
      appendix: '_annot.json',
      converter: new AnnotJSONConverter()
    },
    {
      appendix: '.ctm',
      converter: new CTMConverter()
    }
  ];
}
