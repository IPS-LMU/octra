import {Converter} from './core/obj/Converters/Converter';
import {TextConverter} from './core/obj/Converters/TextConverter';
import {AnnotJSONConverter} from './core/obj/Converters/AnnotJSONConverter';
import {PraatTableConverter} from './core/obj/Converters/PraatTableConverter';
import {CTMConverter} from './core/obj/Converters/CTMConverter';
import {PraatTextgridConverter} from './core/obj/Converters/PraatTextgridConverter';
import {MantisBugReporter} from './core/obj/BugAPI/MantisBugReporter';
import {WavFormat} from './core/obj/media/audio/AudioFormats/WavFormat';
import {OggFormat} from './core/obj/media/audio/AudioFormats/OggFormat';

export class AppInfo {
  public static readonly audioformats = [
    new WavFormat(),
    new OggFormat()
  ];

  public static readonly bugreporters = [
    new MantisBugReporter()
  ];

  public static readonly converters: Converter[] = [
    new TextConverter(),
    new PraatTableConverter(),
    new PraatTextgridConverter(),
    new AnnotJSONConverter(),
    new CTMConverter()
  ];

  static readonly version = '1.2.0';
}
