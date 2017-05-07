import {Converter, File} from './Converter';
import {OAnnotation, OTier} from '../../types/annotation';
import {isNullOrUndefined} from 'util';

export class TextConverter extends Converter {

  public constructor() {
    super();
    this._authors = 'Julian Pömp';
    this._showauthors = true;
    this._conversion.export = true;
    this._conversion.import = false;
  }

  public convert(data: any, filename: string): any {
    let result = '';

    for (let i = 0; i < data.transcript.length; i++) {
      result += data.transcript[i].text;
      if (i < data.transcript.length - 1) {
        result += ' ';
      }
    }

    return result;
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

      filename = annotation.audiofile.name;

    }

    return {
      name: filename,
      content: result,
      encoding: 'UTF-8',
      type: 'text/plain'
    };
  };

  public import(file: File) {
    const result = new OAnnotation();

    return result;
  };
}
