import {
  Converter,
  ExportResult,
  IFile,
  ImportResult,
  OctraAnnotationFormatType,
} from './Converter';
import { contains } from '@octra/utilities';
import { OAnnotJSON, OLabel, OSegment, OSegmentLevel } from '../annotjson';
import { OAudiofile } from '@octra/media';
import { FileInfo } from '@octra/web-media';
import { OctraApplication } from './SupportedApplications';

export class CTMConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'CTM';

  // http://www1.icsi.berkeley.edu/Speech/docs/sctk-1.2/infmts.htm#ctm_fmt_name_0

  public constructor() {
    super();
    this._applications = [{
      application: new OctraApplication()
    }];
    this._extensions = ['.ctm'];
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
    this._notice =
      'OCTRA does not take the confidency level into account. ' +
      'On export to CTM the confidency value will be set to 1 to all values.';
  }

  public export(
    annotation: OAnnotJSON,
    audiofile: OAudiofile,
    levelnum: number
  ): ExportResult {
    let result = '';
    let filename = '';

    if (
      levelnum === undefined ||
      levelnum < 0 ||
      levelnum > annotation.levels.length
    ) {
      return {
        error: `CTMConverter needs a levelnumber`,
      };
    }

    if (!annotation) {
      return {
        error: 'Annotation file is undefined or null',
      };
    }

    if (!audiofile?.sampleRate) {
      return {
        error: 'Samplerate is undefined or null',
      };
    }

    const level = annotation.levels[levelnum];

    for (const levelItem of level.items as OSegment[]) {
      const transcript =
        levelItem.getFirstLabelWithoutName('Speaker')?.value ?? '';
      const start =
        Math.round((levelItem.sampleStart! / audiofile.sampleRate) * 100) / 100;
      const duration =
        Math.round((levelItem.sampleDur! / audiofile.sampleRate) * 100) / 100;
      result += `${annotation.name} 1 ${start} ${duration} ${transcript} 1.00\n`;
    }

    filename = annotation.name + this._extensions[0];

    return {
      file: {
        name: filename,
        content: result,
        encoding: 'UTF-8',
        type: 'text/plain',
      },
    };
  }

  override needsOptionsForImport(
    file: IFile,
    audiofile: OAudiofile
  ): any | undefined {
    return undefined;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (!audiofile?.sampleRate) {
      return {
        error: 'Missing sample rate',
      };
    }
    if (!audiofile?.name) {
      return {
        error: 'Missing audiofile name',
      };
    }
    if (!audiofile?.duration) {
      return {
        error: 'Missing audiofile duration',
      };
    }

    const result = new OAnnotJSON(
      audiofile.name,
      FileInfo.extractFileName(file.name).name,
      audiofile.sampleRate
    );

    const content = file.content;
    const lines: string[] = content.split('\n');

    // check if filename is equal with audio file
    const filename = lines[0].substr(0, lines[0].indexOf(' '));

    if (contains(file.name, filename) && contains(audiofile.name, filename)) {
      const olevel = new OSegmentLevel('Tier_1');

      let start = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] !== '') {
          const columns: string[] = lines[i].split(' ');
          length = 0;
          if (isNaN(Number(columns[2]))) {
            return {
              error: `Parsing error at line ${i + 1} column 3`,
            };
          } else {
            start = Number(columns[2]);
          }

          if (isNaN(Number(columns[3]))) {
            return {
              error: `Parsing error at line ${i + 1} column 4`,
            };
          } else {
            length = Number(columns[3]);
          }
          const sampleRate = audiofile.sampleRate;
          let osegment;

          if (i === 0 && start > 0) {
            // first segment not set
            osegment = new OSegment(i + 1, 0, start * sampleRate, [
              new OLabel('Tier_1', ''),
            ]);

            olevel.items.push(osegment);
          }

          const olabels: OLabel[] = [];
          olabels.push(new OLabel('Tier_1', columns[4]));
          osegment = new OSegment(
            i + 1,
            Math.round(start * sampleRate),
            Math.round(length * sampleRate),
            olabels
          );

          olevel.items.push(osegment);

          if (i === lines.length - 2) {
            if (start + length < audiofile.duration) {
              const osegmentEnd = new OSegment(
                i + 2,
                Math.round((start + length) * sampleRate),
                Math.round(
                  (audiofile.duration - (start + length)) * sampleRate
                ),
                [new OLabel('Tier_1', '')]
              );

              olevel.items.push(osegmentEnd);
            }
          }

          start += length;
        }
      }
      result.levels.push(olevel);

      return {
        annotjson: result,
        audiofile: undefined,
        error: '',
      };
    } else {
      return {
        annotjson: undefined,
        audiofile: undefined,
        error: `The file name stated in the CTM file is not the same as the audio file's.`,
      };
    }
  }
}
