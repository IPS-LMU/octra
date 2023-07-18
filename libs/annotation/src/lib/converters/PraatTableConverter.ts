import { Converter, ExportResult, IFile, ImportResult } from './Converter';
import { contains } from '@octra/utilities';
import {
  AnnotationLevelType,
  ISegment,
  OAnnotJSON,
  OAudiofile,
  OLabel,
  OLevel,
  OSegment
} from "../annotjson";

export class PraatTableConverter extends Converter {
  public constructor() {
    super();
    this._application = 'Praat';
    this._name = 'Text';
    this._extension = '.Table';
    this._website.title = 'Praat';
    this._website.url = 'http://www.fon.hum.uva.nl/praat/';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
  }

  public export(
    annotation: OAnnotJSON,
    audiofile: OAudiofile
  ): ExportResult | undefined {
    let result = '';
    let filename = '';

    const addHeader = (res: string) => {
      return res + 'tmin\ttier\ttext\ttmax\n';
    };

    const addEntry = (res: string, level: OLevel, segment: ISegment) => {
      const tmin = segment.sampleStart / annotation.sampleRate;
      const tmax =
        (segment.sampleStart + segment.sampleDur) / annotation.sampleRate;
      const transcript = segment.labels[0].value;

      return `${res}${tmin}\t${level.name}\t${transcript}\t${tmax}\n`;
    };

    if (annotation) {
      result = addHeader(result);

      for (const level of annotation.levels) {
        // export segments only
        if (level.type === 'SEGMENT') {
          for (const segment of level.items) {
            result = addEntry(result, level, segment as ISegment);
          }
        }
      }

      filename = annotation.name + this._extension;

      return {
        file: {
          name: filename,
          content: result,
          encoding: 'UTF-8',
          type: 'text/plain',
        },
      };
    }

    return undefined;
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult | undefined {
    if (audiofile) {
      const result = new OAnnotJSON(audiofile.name, audiofile.sampleRate);

      const content = file.content;
      const lines: string[] = content.split('\n');

      // check if filename is equal with audio file
      const filename = file.name.substr(0, file.name.indexOf('.Table'));

      if (contains(audiofile.name, filename)) {
        const tiers: string[] = [];
        // get tiers
        for (let i = 1; i < lines.length; i++) {
          if (lines[i] !== '') {
            const columns: string[] = lines[i].split('\t');
            const tier = columns[1];

            if (tiers.filter((a) => a === tier).length === 0) {
              tiers.push(tier);
            }
          }
        }

        for (const tierElement of tiers) {
          const olevel = new OLevel(tierElement, AnnotationLevelType.SEGMENT);
          let start = 0;
          let puffer = 0;
          let id = 1;
          // start at line 0
          for (let i = 1; i < lines.length; i++) {
            if (lines[i] !== '') {
              const columns: string[] = lines[i].split('\t');
              const tmin = Number(columns[0]);
              const tier = columns[1];
              const text = columns[2];
              const tmax = Number(columns[3]);

              length = 0;

              if (isNaN(tmax)) {
                return undefined;
              } else {
                length = Number(tmax - tmin);
              }
              const sampleRate = audiofile.sampleRate;

              if (tier === tierElement) {
                if (isNaN(tmin)) {
                  return undefined;
                } else {
                  const last =
                    olevel.items.length > 0 &&
                    !(
                      olevel.items[olevel.items.length - 1] === undefined ||
                      olevel.items[olevel.items.length - 1] === undefined
                    )
                      ? olevel.items[olevel.items.length - 1]
                      : undefined;
                  if (
                    last !== undefined &&
                    last.sampleStart! + last.sampleDur! ===
                      Math.round(Number(tmin))
                  ) {
                    start = tmin;
                  }
                }

                if (puffer > 0) {
                  // fill
                  const pufferItem = new OSegment(
                    id,
                    Math.round(start * sampleRate),
                    Math.round(puffer * sampleRate),
                    [new OLabel(tier, '')]
                  );
                  start = start + puffer;
                  olevel.items.push(pufferItem);
                  puffer = 0;
                  id++;
                }
                const olabels: OLabel[] = [];
                olabels.push(new OLabel(tier, text));
                const osegment = new OSegment(
                  id,
                  Math.round(start * sampleRate),
                  Math.round(length * sampleRate),
                  olabels
                );

                olevel.items.push(osegment);
                start += length;
                id++;
              } else {
                puffer += length;
              }
            }
          }
          result.levels.push(olevel);
        }
        if (tiers.length > 0) {
          return {
            annotjson: result,
            audiofile: undefined,
            error: '',
          };
        } else {
          return {
            annotjson: undefined,
            audiofile: undefined,
            error: `Invalid Praat table file.`,
          };
        }
      } else {
        return {
          annotjson: undefined,
          audiofile: undefined,
          error: `Filenames for .Table extension does not match.`,
        };
      }
    }

    return {
      annotjson: undefined,
      audiofile: undefined,
      error: `This PraatTable file is not compatible with this audio file`,
    };
  }
}
