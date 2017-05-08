import {Converter, File} from './Converter';
import {ISegment, ITier, OAnnotation} from '../../types/annotation';
import {isNullOrUndefined} from 'util';

export class PraatTableConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'Text (*.Table)';
    this._showauthors = false;
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = false;
  }

  public export(annotation: OAnnotation): File {
    let result = '';
    let filename = '';

    const addHeader = (res: string) => {
      return res + 'tmin\ttier\ttext\ttmax\n';
    };

    const addEntry = (res: string, tier: ITier, segment: ISegment) => {
      const tmin = segment.start / annotation.audiofile.samplerate;
      const tmax = (segment.start + segment.length) / annotation.audiofile.samplerate;

      return `${res}${tmin}\t${tier.name}\t${segment.transcript}\t${tmax}\n`;
    };

    if (!isNullOrUndefined(annotation)) {
      result = addHeader(result);

      for (let i = 0; i < annotation.tiers.length; i++) {
        const tier = annotation.tiers[i];
        for (let j = 0; j < tier.segments.length; j++) {
          console.log('segment found');
          const segment = tier.segments[j];
          result = addEntry(result, tier, segment);
        }
      }

      filename = annotation.audiofile.name + '.Table';
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
