import { OAudiofile } from '@octra/media';
import { ensureNumber, last } from '@octra/utilities';
import { FileInfo } from '@octra/web-media';
import { OAnnotJSON, OLabel, OSegment, OSegmentLevel } from '../annotjson';
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
} from './SupportedApplications';

class ParsedBASPartitur {
  LHD!: string;
  SNB?: number;
  SAM?: number;
  SBF?: string;
  SSB?: number;
  NCH?: number;
  SAO?: string;
  LBD?: string;

  KAN: string[] = [];
  ORT: string[] = [];
  TRO: string[] = [];
  WOR: {
    start: number;
    duration: number;
    ortIndex: number;
    value: string;
  }[] = [];
  SPK: {
    ortIndex: number;
    value: string;
  }[] = [];
  TRN: {
    start: number;
    duration: number;
    value: string;
    ortIndex: number;
  }[] = [];

  parse(lines: string[]) {
    for (const line of lines) {
      const search = line.match(
        new RegExp(
          '^((LHD)|(SAM)|(KAN)|(ORT)|(DAS)|(TR2)|(SUP)|(PRS)|(NOI)|(LBP)|(LBG)|(PRO)|(POS)|(LMA)|(SYN)|(FUN)|(LEX)|' +
            '(IPA)|(TRN)|(TRS)|(GES)|(USH)|(USM)|(OCC)|(USP)|(GES)|(TLN)|(PRM)|(TRW)|(MAS)|(SPK)|(TRO)|(WOR))',
          'g',
        ),
      );

      if (search) {
        const columns = line.split(/[\s\t]+/g);

        if (columns[0] === 'LHD:') {
          this.LHD = `${columns[1]} ${columns[2]}`;
        } else if (columns[0] === 'SNB:') {
          this.SNB = ensureNumber(columns[1]);
        } else if (columns[0] === 'SAM:') {
          this.SAM = ensureNumber(columns[1]);
        } else if (columns[0] === 'SBF:') {
          this.SBF = columns[1];
        } else if (columns[0] === 'SSB:') {
          this.SSB = ensureNumber(columns[1]);
        } else if (columns[0] === 'NCH:') {
          this.NCH = ensureNumber(columns[1]);
        } else if (columns[0] === 'SAO:') {
          this.SAO = columns.slice(1).join(' ');
        } else if (columns[0] === 'LBD:') {
          this.LBD = columns[1] ?? '';
        } else if (columns[0] === 'KAN:') {
          this.KAN.push(columns.slice(2).join(' '));
        } else if (columns[0] === 'ORT:') {
          this.ORT.push(columns[2]);
        } else if (columns[0] === 'SPK:') {
          this.SPK.push({
            ortIndex: ensureNumber(columns[1]) ?? -1,
            value: columns.slice(2).join(' '),
          });
        } else if (columns[0] === 'TRO:') {
          this.TRO.push(columns[2]);
        } else if (columns[0] === 'WOR:') {
          this.WOR.push({
            start: ensureNumber(columns[1]) ?? -1,
            duration: ensureNumber(columns[2]) ?? -1,
            ortIndex: ensureNumber(columns[3]) ?? -1,
            value: columns[4],
          });
        } else if (columns[0] === 'TRN:') {
          const parsed =
            /(TRN): ([0-9]+) ([0-9]+) ([0-9]+)(?:,[0-9]+)* (.*)/g.exec(
              line,
            );
          if (parsed) {
            this.TRN.push({
              start: ensureNumber(parsed[2])!,
              duration: ensureNumber(parsed[3])!,
              ortIndex: ensureNumber(parsed[4])!,
              value: parsed[5],
            });
          }
        }
      }
    }
  }
}

// http://www.bas.uni-muenchen.de/Bas/BasFormatsdeu.html
export class PartiturConverter extends Converter {
  override _name: OctraAnnotationFormatType = 'BASPartitur';

  public constructor() {
    super();
    this._applications = [
      { application: new BASWebservicesApplication(), recommended: true },
      { application: new OctraApplication() },
    ];
    this._extensions = ['.par'];
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._notice =
      'While importing a .par file OCTRA combines TRN and ORT lines to one tier. ' +
      'This tier only consists of time aligned segments. For export OCTRA creates ORT and TRN lines from the transcription.';
    this._multitiers = true;
  }

  public export(
    annotation: OAnnotJSON,
    audiofile: OAudiofile,
    levelnum?: number,
  ): ExportResult {
    if (!annotation) {
      return {
        error: 'Annotation is undefined or null',
      };
    }

    if (!audiofile?.sampleRate) {
      return {
        error: 'Samplerate is undefined or null',
      };
    }

    const result: ExportResult = {
      file: {
        name: `${annotation.name}${this._extensions[0]}`,
        content: 'SAM ' + audiofile.sampleRate,
        encoding: 'UTF-8',
        type: 'text',
      },
    };
    let content = `LHD: Partitur 1.3.3
SAM: ${audiofile.sampleRate}
NCH: 1
LBD:\n`;

    let ort: string[] = [];
    let speakers: string[] = [];
    const trn: string[] = [];

    let ortCounter = 0;

    // filter all segment items with transcript and sort them asc by sample start
    const items = annotation.levels
      .filter((a) => a.type === 'SEGMENT')
      .map((a) =>
        a.items.map((b) => {
          const spkLabel = b.labels.find((c) => c.name === 'Speaker');
          if (!spkLabel) {
            b.labels.push(new OLabel('Speaker', a.name));
          }
          return b;
        }),
      )
      .flat()
      .filter((a) => {
        const transcript = (a as OSegment).getFirstLabelWithoutName('Speaker');
        return transcript && transcript.value !== '';
      }) as OSegment[];
    items.sort((a, b) => {
      if (a.sampleStart === b.sampleStart) {
        if (a.sampleDur === b.sampleDur) {
          return 0;
        } else if (a.sampleDur < b.sampleDur) {
          return -1;
        }
      } else if (a.sampleStart < b.sampleStart) {
        return -1;
      }
      return 1;
    });

    for (const item of items as OSegment[]) {
      const speaker = item.labels.find((l) => l.name === 'Speaker');
      const words = (
        item.getFirstLabelWithoutName('Speaker')?.value ?? ''
      ).split(' ');
      ort = ort.concat(words);
      speakers = speakers.concat(words.map((a) => speaker?.value ?? 'S'));
      let trnLine = `TRN: ${item.sampleStart} ${item.sampleDur} `;

      for (let j = 0; j < words.length; j++) {
        trnLine += `${ortCounter + j}`;
        if (j < words.length - 1) {
          trnLine += ',';
        }
      }
      ortCounter += words.length;
      trnLine += ` ${item.getFirstLabelWithoutName('Speaker')?.value ?? ''}\n`;
      trn.push(trnLine);
    }

    for (let i = 0; i < ort.length; i++) {
      content += `ORT: ${i} ${ort[i]}\n`;
    }

    for (let i = 0; i < speakers.length; i++) {
      content += `SPK: ${i} ${speakers[i]}\n`;
    }

    for (const trnElement of trn) {
      content += trnElement;
    }

    result.file!.content = content;

    return result;
  }

  override needsOptionsForImport(
    file: IFile,
    audiofile: OAudiofile,
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

    const lines = file.content.split(/\r?\n/g);
    const result = new OAnnotJSON(
      audiofile.name,
      FileInfo.extractFileName(file.name).name,
      audiofile.sampleRate,
    );

    const parsedPartitur = new ParsedBASPartitur();
    parsedPartitur.parse(lines);

    if (!parsedPartitur.SAM || parsedPartitur.SAM !== audiofile.sampleRate) {
      return {
        error: `Sample Rate of audio file is not equal to the value from Partitur`,
      };
    }

    // skip not needed information and read needed information
    let counter = 1;

    if (parsedPartitur.SPK.length === 0 || parsedPartitur.WOR.length === 0) {
      // fallback to TRN
      if (parsedPartitur.TRN.length > 0) {
        let level: OSegmentLevel<OSegment> | undefined = undefined;

        for (const item of parsedPartitur.TRN) {
          const speaker =
            parsedPartitur.SPK.find((a) => a.ortIndex === item.ortIndex)
              ?.value ?? 'TRN';
          level = result.levels.find(
            (a) => a.name === speaker,
          ) as OSegmentLevel<OSegment>;
          if (!level) {
            level = new OSegmentLevel<OSegment>(speaker);
            result.levels.push(level);
          }

          level.items.push(
            new OSegment(counter++, item.start, item.duration, [
              new OLabel(speaker, item.value),
              ...(speaker !== 'TRN' ? [new OLabel('Speaker', speaker)] : []),
            ]),
          );
        }
      }
    } else {
      // found speakers. We need to read all WOR items and assign them to levels
      if (parsedPartitur.WOR.length === 0) {
        return {
          error: "Can't read Partitur file with SPK but missing WOR items.",
        };
      } else {
        for (const worElement of parsedPartitur.WOR) {
          if (worElement.ortIndex > -1) {
            const speaker =
              parsedPartitur.SPK.find((a) => a.ortIndex === worElement.ortIndex)
                ?.value ?? 'NA';
            let level: OSegmentLevel<OSegment> | undefined = result.levels.find(
              (a) => a.name === speaker,
            ) as any;

            if (!level) {
              level = new OSegmentLevel(speaker);
              result.levels.push(level);
            }

            level.items.push(
              new OSegment(counter++, worElement.start, worElement.duration, [
                new OLabel(speaker, worElement.value),
                new OLabel('Speaker', speaker),
              ]),
            );
          }
        }
      }
    }

    // normalize levels
    if (result.levels.length > 0) {
      for (const level of result.levels as OSegmentLevel<OSegment>[]) {
        for (let i = 0; i < level.items.length; i++) {
          const item = level.items[i];
          const previousItem = i > 0 ? level.items[i - 1] : undefined;
          const startSample =
            (previousItem?.sampleStart ?? 0) + (previousItem?.sampleDur ?? 0);
          const gapSamples = item.sampleStart - startSample;
          const gapSeconds = gapSamples / audiofile.sampleRate;

          if (gapSamples !== 0) {
            // gap
            if (gapSeconds < 1) {
              // change sampleStart of first segment to startSample
              item.sampleDur += gapSamples;
              item.sampleStart = startSample;
            } else {
              // fill with new segment

              const test = item.sampleStart - (startSample + gapSamples);
              const newItem = new OSegment(counter++, startSample, gapSamples, [
                new OLabel(level.name, ''),
              ]);
              const speakerLabel = item.labels.find(
                (a) => a.name !== level.name,
              );
              if (speakerLabel) {
                newItem.labels.push(speakerLabel.clone());
              }
              level.items = [
                ...level.items.slice(0, i),
                newItem,
                ...level.items.slice(i),
              ];
              i++;
            }
          }
        }
      }

      for (const level of result.levels as OSegmentLevel<OSegment>[]) {
        const lastItem = last(level.items);

        if (!lastItem) {
          level.items.push(
            new OSegment(counter++, 0, audiofile.duration, [
              new OLabel('OCTRA_1', ''),
            ]),
          );
        } else {
          const gapSamples =
            audiofile.duration - (lastItem.sampleStart + lastItem.sampleDur);
          const gapSeconds = gapSamples / audiofile.sampleRate;

          if (gapSeconds !== 0) {
            if (gapSeconds < 1) {
              lastItem.sampleDur += gapSamples;
            } else {
              // fill with empty item
              const newItem = new OSegment(
                counter++,
                lastItem.sampleStart + lastItem.sampleDur,
                gapSamples,
                [new OLabel(level.name, '')],
              );
              const speakerLabel = lastItem.labels.find(
                (a) => a.name !== level.name,
              );
              if (speakerLabel) {
                newItem.labels.push(speakerLabel.clone());
              }
              level.items.push(newItem);
            }
          }
        }
      }

      return {
        annotjson: result,
      };
    } else {
      return {
        error: `Input file not compatible with Praat Partitur.`,
      };
    }
  }
}
