import { NavigationExtras } from '@angular/router';
import { AllOctraConverters, Converter } from '@octra/annotation';
import { MusicMetadataFormat, WavFormat } from '@octra/web-media';

export class AppInfo {
  public static readonly audioformats = [
    new WavFormat(),
    new MusicMetadataFormat(),
  ];

  public static readonly converters: Converter[] = AllOctraConverters;

  public static readonly themes: string[] = ['default', 'shortAudioFiles'];
  static readonly manualURL =
    'https://clarin.phonetik.uni-muenchen.de/apps/octra/manuals/octra/';

  static readonly maxAudioFileSize = 3000;

  public static readonly queryParamsHandling: NavigationExtras = {
    queryParamsHandling: 'merge',
    preserveFragment: false,
  };

  public static BUILD = {
    version: '2.0.0',
    hash: '2893u092i349i23904',
    timestamp: new Date().toISOString(),
  };
}
