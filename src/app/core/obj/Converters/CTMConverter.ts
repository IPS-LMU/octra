import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../Annotation/AnnotJSON';
import {isNullOrUndefined} from 'util';
import {Functions} from '../../shared/Functions';

export class CTMConverter extends Converter {

  // http://www1.icsi.berkeley.edu/Speech/docs/sctk-1.2/infmts.htm#ctm_fmt_name_0

  public constructor() {
    super();
    this._application = 'CTM';
    this._name = 'CTM';
    this._extension = '.ctm';
    this._website.title = '';
    this._website.url = '';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
    this._notice = 'OCTRA does not take the confidency level into account. On export to CTM the confidency value will be set to 1 to all values.';
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    let result = '';
    let filename = '';

    if (!isNullOrUndefined(annotation)) {
      const level = annotation.levels[levelnum];

      for (let j = 0; j < level.items.length; j++) {
        const transcript = level.items[j].labels[0].value;
        const start = Math.round((level.items[j].sampleStart / audiofile.samplerate) * 100) / 100;
        const duration = Math.round((level.items[j].sampleDur / audiofile.samplerate) * 100) / 100;
        result += `${annotation.name} 1 ${start} ${duration} ${transcript} 1.00\n`;
      }

      filename = annotation.name + this._extension;

    }

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-8',
        type: 'text/plain'
      }
    };
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);

      const content = file.content;
      const lines: string[] = content.split('\n');


      // check if filename is equal with audio file
      const filename = lines[0].substr(0, lines[0].indexOf(' '));

      if (Functions.contains(file.name, filename) && Functions.contains(audiofile.name, filename)) {
        const olevel = new OLevel('Tier_1', 'SEGMENT');

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
                [(new OLabel('Tier_1', ''))]
              );

              olevel.items.push(osegment);
            }

            const olabels: OLabel[] = [];
            olabels.push((new OLabel('Tier_1', columns[4])));
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
                  [(new OLabel('Tier_1', ''))]
                );

                olevel.items.push(osegment_end);
              }
            }

            start += length;
          }
        }
        result.levels.push(olevel);

        return {
          annotjson: result,
          audiofile: null
        };
      }
    }

    return null;
  }
}
