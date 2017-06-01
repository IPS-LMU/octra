import {Converter, File} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../../types/annotjson';
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

  public export(annotation: OAnnotJSON): File {
    let result = '';
    let filename = '';

    if (!isNullOrUndefined(annotation)) {
      for (let i = 0; i < annotation.levels.length; i++) {
        const level: OLevel = annotation.levels[i];

        for (let j = 0; j < level.items.length; j++) {
          const transcript = level.items[j].labels[0].value;
          result += transcript;
          if (i < transcript.length - 1) {
            result += ' ';
          }
        }
      }

      filename = annotation.name;

    }

    return {
      name: filename,
      content: result,
      encoding: 'UTF-8',
      type: 'text/plain'
    };
  };

  public import(file: File, audiofile: OAudiofile): OAnnotJSON {
    const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

    const content = file.content;
    const lines: string[] = content.split('\n');


    // check if filename is equal with audio file
    const filename = lines[0].substr(0, lines[0].indexOf(' '));

    if (Functions.contains(file.name, filename) && Functions.contains(audiofile.name, filename)) {
      console.log('check ' + audiofile.name + '==' + filename);
      const olevel = new OLevel('Orthographic', 'SEGMENT');

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
            const osegment = new OSegment((i + 1),
              0,
              start * samplerate,
              [(new OLabel('Orthographic', ''))]
            );

            olevel.items.push(osegment);
          }

          const olabels: OLabel[] = [];
          olabels.push((new OLabel('Orthographic', columns[4])));
          const osegment = new OSegment(
            (i + 1),
            Math.round(start * samplerate),
            Math.round(length * samplerate),
            olabels
          );

          olevel.items.push(osegment);

          if (i === lines.length - 2) {
            if ((start + length) < audiofile.duration) {

              const osegment_end = new OSegment(
                (i + 2),
                Math.round((start + length) * samplerate),
                Math.round((audiofile.duration - (start + length)) * samplerate),
                [(new OLabel('Orthographic', ''))]
              );

              olevel.items.push(osegment_end);
            }
          }

          start += length;
        }
      }
      result.levels.push(olevel);
      return result;
    }

    return null;
  };
}
