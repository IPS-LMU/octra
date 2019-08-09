import {
  AnnotJSONConverter,
  BundleJSONConverter,
  Converter,
  CTMConverter,
  PartiturConverter,
  PraatTableConverter,
  PraatTextgridConverter,
  TextConverter
} from './core/obj/Converters';
import {MantisBugReporter} from './core/obj/BugAPI/MantisBugReporter';
import {OggFormat, WavFormat} from './media-components/obj/media/audio/AudioFormats';
import {EmailBugReporter} from './core/obj/BugAPI/EmailBugReporter';
import {NavigationExtras} from '@angular/router';
import {ELANConverter} from './core/obj/Converters/ELANConverter';
import {SRTConverter} from './core/obj/Converters/SRTConverter';
import {WebVTTConverter} from './core/obj/Converters/WebVTTConverter';

declare var octraVersion: string;
declare var octraLastUpdated: string;

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
    new TextConverter(),
    new ELANConverter(),
    new SRTConverter(),
    new WebVTTConverter()
  ];

  public static readonly themes: string[] = [
    'default',
    'shortAudioFiles'
  ];

  static readonly version = octraVersion;
  static readonly lastUpdate = octraLastUpdated;
  static readonly debugging = false;

  public static readonly queryParamsHandling: NavigationExtras = {
    queryParamsHandling: '',
    preserveFragment: false
  };
}
