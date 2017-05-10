import {Converter, File} from './Converter';
import {OAnnotation, OAudiofile, OTier} from '../../types/annotation';
import {isNullOrUndefined} from 'util';

export class AnnotJSONConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Emu-WebApp';
    this._name = 'AnnotJSON';
    this._website.title = 'Emu-WebApp';
    this._website.url = 'http://ips-lmu.github.io/EMU-webApp/';
    this._showauthors = true;
    this._conversion.export = true;
    this._conversion.import = false;
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

  public import(file: File, audiofile: OAudiofile) {
    const result = new OAnnotation();

    return null;
  };
}
