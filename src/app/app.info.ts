import {Converter} from './core/obj/Converters/Converter';
import {TextConverter} from './core/obj/Converters/TextConverter';
import {AnnotJSONConverter} from './core/obj/Converters/AnnotJSONConverter';
import {PraatTableConverter} from './core/obj/Converters/PraatTableConverter';
import {CTMConverter} from './core/obj/Converters/CTMConverter';
import {PraatTextgridConverter} from './core/obj/Converters/PraatTextgridConverter';
import {MantisBugReporter} from './core/obj/BugAPI/MantisBugReporter';
import {WavFormat} from './core/obj/media/audio/AudioFormats/WavFormat';
import {OggFormat} from './core/obj/media/audio/AudioFormats/OggFormat';
import {BundleJSONConverter} from './core/obj/Converters/BundleJSONConverter';
import {EmailBugReporter} from './core/obj/BugAPI/EmailBugReporter';
import {PartiturConverter} from './core/obj/Converters/PartiturConverter';

export class AppInfo {
  public static readonly audioformats = [
    new WavFormat(),
    new OggFormat()
  ];

  public static readonly bugreporters = [
    new MantisBugReporter(),
    new EmailBugReporter()
  ];

  public static readonly converters: Converter[] = [
    new AnnotJSONConverter(),
    new PraatTableConverter(),
    new PraatTextgridConverter(),
    new CTMConverter(),
    new PartiturConverter(),
    new BundleJSONConverter(),
    new TextConverter()
  ];

  static readonly version = '1.2.2';
}
