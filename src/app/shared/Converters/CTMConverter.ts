import {Converter, File} from './Converter';
import {OAnnotation, OAudiofile, OSegment, OTier} from '../../types/annotation';
import {isNullOrUndefined} from 'util';
import {Functions} from '../Functions';

export class CTMConverter extends Converter {

  // http://www1.icsi.berkeley.edu/Speech/docs/sctk-1.2/infmts.htm#ctm_fmt_name_0

  public constructor() {
    super();
    this._application = 'CTM';
    this._name = 'CTM';
    this._showauthors = true;
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = false;
    this._conversion.import = true;
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

  public import(file: File, audiofile: OAudiofile) {
    console.log('KOKOKOKO');
    console.log(audiofile);
    const result = new OAnnotation();
    result.audiofile = audiofile;

    const content = file.content;
    const lines: string[] = content.split('\n');

    console.log('lines: ' + lines.length);

    // check if filename is equal with audio file
    const filename = lines[0].substr(0, lines[0].indexOf(' '));

    if (Functions.contains(file.name, filename)) {
      const otier = new OTier();
      otier.name = 'word';

      let start = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] !== '') {
          const columns: string[] = lines[i].split(' ');
          length = 0;
          if (isNaN(Number(columns[2]))) {
            console.error(columns[2] + ' is NaN');
            return null;
          } else {
            start = Number(columns[2]);
          }

          if (isNaN(Number(columns[3]))) {
            console.error(columns[3] + ' is NaN');
            return null;
          } else {
            length = Number(columns[3]);
          }
          const samplerate = audiofile.samplerate;

          if (i === 0 && start > 0) {
            // first segment not set
            const osegment = new OSegment(
              0,
              start * samplerate,
              ''
            );
            otier.segments.push(osegment);
          }

          const osegment = new OSegment(
            Math.round(start * samplerate),
            Math.round(length * samplerate),
            columns[4]
          );

          otier.segments.push(osegment);

          if (i === lines.length - 2) {
            console.log('ok in');
            console.log(`compare ${start + length} with ${audiofile.duration}`);
            if ((start + length) < audiofile.duration) {

              const osegment_end = new OSegment(
                Math.round((start + length) * samplerate),
                Math.round((audiofile.duration - (start + length)) * samplerate),
                ''
              );

              otier.segments.push(osegment_end);
            }
          }

          start += length;
        }
      }
      result.tiers.push(otier);
    }

    console.log(result);
    return result;
  };
}
