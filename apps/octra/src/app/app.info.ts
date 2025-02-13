import { NavigationExtras } from '@angular/router';
import {
  AnnotJSONConverter,
  BundleJSONConverter,
  Converter,
  CTMConverter,
  ELANConverter,
  PartiturConverter,
  PraatTableConverter,
  PraatTextgridConverter,
  SRTConverter,
  TextConverter,
  WebVTTConverter,
  WhisperJSONConverter,
} from '@octra/annotation';
import { MusicMetadataFormat, WavFormat } from '@octra/web-media';

export class AppInfo {
  public static readonly audioformats = [
    new WavFormat(),
    new MusicMetadataFormat(),
  ];

  public static readonly converters: Converter[] = [
    new AnnotJSONConverter(),
    new WhisperJSONConverter(),
    new PraatTableConverter(),
    new PraatTextgridConverter(),
    new CTMConverter(),
    new PartiturConverter(),
    new BundleJSONConverter(),
    new ELANConverter(),
    new SRTConverter(),
    new WebVTTConverter(),
    new TextConverter(),
  ];

  public static readonly themes: string[] = ['default', 'shortAudioFiles'];
  static readonly manualURL =
    'https://clarin.phonetik.uni-muenchen.de/apps/octra/manual/1.4.0/en/';

  static readonly maxAudioFileSize = 3000;

  public static readonly queryParamsHandling: NavigationExtras = {
    queryParamsHandling: "merge",
    preserveFragment: false,
  };

  public static BUILD = {
    version: '0.0.0',
    hash: '2893u092i349i23904',
    timestamp: new Date().toISOString(),
  };
}
