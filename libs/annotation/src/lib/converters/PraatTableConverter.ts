import { OAudiofile } from '@octra/media';
import { FileInfo } from '@octra/web-media';
import {
  OAnnotJSON,
  OAnyLevel,
  OLabel,
  OSegment,
  OSegmentLevel,
} from '../annotjson';
import { contains } from '../functions';
import {
  Converter,
  ExportResult,
  IFile,
  ImportResult,
  OctraAnnotationFormatType,
} from './Converter';
import {
  BASWebservicesApplication,
  OctraApplication,
  PraatApplication,
} from './SupportedApplications';

export class PraatTableConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'PraatTextTable';

  public constructor() {
    super();
    this._applications = [];
    this._extensions = ['.Table'];
    this._applications = [
      {
        application: new PraatApplication(),
        recommended: true,
      },
      {
        application: new OctraApplication(),
      },
      {
        application: new BASWebservicesApplication(),
      },
    ];
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
  }

  public export(annotation: OAnnotJSON): ExportResult {
    if (!annotation) {
      return {
        error: 'Annotation is undefined or null',
      };
    }

    let result = '';
    let filename = '';

    const addHeader = (res: string) => {
      return res + 'tmin\ttier\ttext\ttmax\n';
    };

    const addEntry = (
      res: string,
      level: OAnyLevel<OSegment>,
      segment: OSegment
    ) => {
      const tmin = segment.sampleStart / annotation.sampleRate;
      const tmax =
        (segment.sampleStart + segment.sampleDur) / annotation.sampleRate;
      const transcript =
        segment.getFirstLabelWithoutName('Speaker')?.value ?? '';

      return `${res}${tmin}\t${level.name}\t${transcript}\t${tmax}\n`;
    };

    result = addHeader(result);

    for (const level of annotation.levels) {
      // export segments only
      if (level.type === 'SEGMENT') {
        for (const segment of level.items as OSegment[]) {
          result = addEntry(result, level, segment);
        }
      }
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

    const result = new OAnnotJSON(
      audiofile.name,
      file.name,
      audiofile.sampleRate
    );

    const content = file.content;
    const lines: string[] = content.split('\n');
    const startWithLine = /tmin\ttier\ttext\ttmax/g.exec(lines[0]) !== null ? 1 : 0;

    // check if filename is equal with audio file
    const filename = FileInfo.extractFileName(file.name).name;

    if (contains(audiofile.name, filename)) {
      const tiers: string[] = [];
      // get tiers
      for (let i = startWithLine; i < lines.length; i++) {
        if (lines[i] !== '') {
          const columns: string[] = lines[i].split('\t');
          const tier = columns[1];

          if (tiers.filter((a) => a === tier).length === 0) {
            tiers.push(tier);
          }
        }
      }

      for (const tierElement of tiers) {
        const olevel = new OSegmentLevel(tierElement);
        let start = 0;
        let puffer = 0;
        let id = 1;
        // start at line 0
        for (let i = startWithLine; i < lines.length; i++) {
          if (lines[i] !== '') {
            const columns: string[] = lines[i].split('\t');
            const tmin = Number(columns[0]);
            const tier = columns[1];
            const text = columns[2];
            const tmax = Number(columns[3]);

            let rightBoundary = 0;

            if (isNaN(tmax)) {
              return {
                error: `Parsing error at line ${i + 1} column 4: Not a number`,
              };
            } else {
              rightBoundary = Number(tmax);
            }
            const sampleRate = audiofile.sampleRate;

            if (tier === tierElement) {
              if (isNaN(tmin)) {
                return {
                  error: `Parsing error at line ${
                    i + 1
                  } column 1: Not a number`,
                };
              } else {
                const last = (
                  olevel.items.length > 0 &&
                  !(
                    olevel.items[olevel.items.length - 1] === undefined ||
                    olevel.items[olevel.items.length - 1] === undefined
                  )
                    ? olevel.items[olevel.items.length - 1]
                    : undefined
                ) as OSegment;
                if (
                  (last !== undefined &&
                    Math.round(
                      (last.sampleStart + last.sampleDur) / sampleRate
                    ) < Math.round(Number(tmin))) ||
                  (!last && tmin > start)
                ) {
                  if (last) {
                    // add empty segment
                    olevel.items.push(
                      new OSegment(
                        id++,
                        last.sampleStart + last.sampleDur,
                        Math.round(
                          tmin * sampleRate -
                            (last.sampleStart + last.sampleDur)
                        ),
                        [new OLabel(tier, '')]
                      )
                    );
                  } else {
                    // add empty segment
                    olevel.items.push(
                      new OSegment(
                        id++,
                        start * sampleRate,
                        Math.round(
                          tmin * sampleRate -
                          (start * sampleRate) - (tmin * sampleRate)
                        ),
                        [new OLabel(tier, '')]
                      )
                    );
                  }

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
                Math.round((rightBoundary - start) * sampleRate),
                olabels
              );

              olevel.items.push(osegment);
              start += rightBoundary - start;
              id++;
            } else {
              puffer += rightBoundary - start;
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
}
