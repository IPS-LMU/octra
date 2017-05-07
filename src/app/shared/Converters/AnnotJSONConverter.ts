import {Converter, File} from './Converter';
import {OAnnotation, OTier} from '../../types/annotation';
import {isNullOrUndefined} from 'util';

export class AnnotJSONConverter extends Converter {

  public convert(data: any, filename: string): any {
    /*
     const result = this.getDefaultAnnotJSON();

     // set default settings
     result.name = filename;
     result.annotates = filename + '.wav';
     result.sampleRate = 1000;

     for (let i = 0; i < data.transcript.length; i++) {
     const segment = data.transcript[i];
     result.levels[0].items.push(
     {
     id: (i + 1),
     sampleStart: segment.start,
     sampleDur: segment.length,
     labels: [
     {
     name: 'Orthographic',
     value: segment.text
     }
     ]
     }
     );
     }*/

    return '';
  }

  public constructor() {
    super();
    this._authors = 'Julian Pömp';
    this._showauthors = true;
    this._conversion.export = true;
    this._conversion.import = true;
  }

  public export(annotation: OAnnotation): File {
    const result = {
      name: '',
      annotates: '',
      sampleRate: 0,
      levels: [],
      links: []
    };
    let filename = '';

    if (!isNullOrUndefined(annotation)) {
      // set default settings
      result.name = annotation.audiofile.name;
      result.annotates = annotation.audiofile.name + '.wav';
      result.sampleRate = annotation.audiofile.samplerate;

      for (let j = 0; j < annotation.tiers.length; j++) {
        const tier: OTier = annotation.tiers[j];

        result.levels.push({
          name: tier.name,
          type: 'SEGMENT',
          items: []
        });

        for (let i = 0; i < tier.segments.length; i++) {
          const segment = tier.segments[i];

          result.levels[j].items.push(
            {
              id: (i + 1),
              sampleStart: segment.start,
              sampleDur: segment.length,
              labels: [
                {
                  name: tier.name,
                  value: segment.transcript
                }
              ]
            }
          );
        }
      }

      filename = annotation.audiofile.name;

    }

    return {
      name: filename + '_annot.json',
      content: JSON.stringify(result, null, 2),
      encoding: 'UTF-8',
      type: 'application/json'
    };
  };

  public import(file: File) {
    const result = new OAnnotation();

    return result;
  };
}
