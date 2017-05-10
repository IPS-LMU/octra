import {Converter, File} from './Converter';
import {OAnnotation, OAudiofile, OTier} from '../../types/annotation';
import {isNullOrUndefined} from 'util';

export class TextConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Text Editor';
    this._name = 'Text';
    this._showauthors = true;
    this._website.title = 'WebMaus';
    this._website.url = 'https://clarin.phonetik.uni-muenchen.de/BASWebServices/#/services/WebMAUSBasic';
    this._conversion.export = true;
    this._conversion.import = false;
  }

  public export(annotation: OAnnotation): File {
    let result = '';
    let filename = '';

    if (!isNullOrUndefined(annotation)) {
      for (let i = 0; i < annotation.tiers.length; i++) {
        const tier: OTier = annotation.tiers[i];

        for (let j = 0; j < tier.segments.length; j++) {
          const transcript = tier.segments[j].transcript;
          result += transcript;
          if (i < transcript.length - 1) {
            result += ' ';
          }
        }
      }

      filename = annotation.audiofile.name + '.txt';

    }

    return {
      name: filename,
      content: result,
      encoding: 'UTF-8',
      type: 'text/plain'
    };
  };

  public import(file: File, audiofile: OAudiofile) {
    const result = new OAnnotation();

    return null;
  };
}
