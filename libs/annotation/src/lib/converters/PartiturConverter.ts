import { OAudiofile } from '@octra/media';
import { last } from '@octra/utilities';
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
    let pointer = 0;

    const result = new OAnnotJSON(
      audiofile.name,
      FileInfo.extractFileName(file.name).name,
      audiofile.sampleRate,
    );

    // skip not needed information and read needed information
    let counter = 1;
    const speakers: string[] = [];

    while (pointer < lines.length) {
      const search = lines[pointer].match(
        new RegExp(
          '^((LHD)|(SAM)|(KAN)|(ORT)|(DAS)|(TR2)|(SUP)|(PRS)|(NOI)|(LBP)|(LBG)|(PRO)|(POS)|(LMA)|(SYN)|(FUN)|(LEX)|' +
            '(IPA)|(TRN)|(TRS)|(GES)|(USH)|(USM)|(OCC)|(USP)|(GES)|(TLN)|(PRM)|(TRW)|(MAS)|(SPK))',
          'g',
        ),
      );

      if (search) {
        const columns = lines[pointer].split(/[\s\t]+/g);

        if (search[0] === 'SAM') {
          if (audiofile.sampleRate !== Number(columns[1])) {
            console.error(
              `Sample Rate of audio file is not equal to the value from Partitur` +
                ` file! ${audiofile.sampleRate} !== ${columns[1]}`,
            );
          }
        } else if (search[0] === 'SPK') {
          speakers.push(columns[2]);
        } else if (search[0] === 'TRN') {
          const transcript = lines[pointer];
          const transcriptArray = transcript.match(
            /TRN:[\s\t]+([0-9]+)[\s\t]([0-9]+)[\s\t]+((?:[0-9],?)+)[\s\t]+(.*)/,
          );

          if (transcriptArray) {
            const startSample = Number(transcriptArray[1]);
            const durSample = Number(transcriptArray[2]);
            const affectedUnits = transcriptArray[3]
              .split(',')
              .filter((a) => a !== undefined && a !== null && a !== '');
            const transcript = transcriptArray[4];

            if (affectedUnits.length > 0) {
              const speakerIndex = Number(affectedUnits[0]);
              const speaker = speakers
                ? (speakers[speakerIndex] ?? 'TRN')
                : 'TRN';
              let level: OSegmentLevel<OSegment> | undefined =
                result.levels.find((a) => a.name === speaker) as
                  | OSegmentLevel<OSegment>
                  | undefined;

              if (!level) {
                level = new OSegmentLevel(speaker);
                result.levels.push(level);
              }

              let previousItem: OSegment | undefined = last(
                level.items,
              ) as OSegment;

              if (!previousItem && startSample > 0) {
                previousItem = new OSegment(counter++, 0, startSample, [
                  new OLabel(speaker, ''),
                ]);
                level.items.push(previousItem);
              } else if (
                previousItem &&
                previousItem.sampleStart + previousItem.sampleDur < startSample
              ) {
                // fill with empty segment
                previousItem = new OSegment(
                  counter++,
                  previousItem.sampleStart + previousItem.sampleDur,
                  startSample -
                    (previousItem.sampleStart + previousItem.sampleDur),
                  [new OLabel(speaker, '')],
                );
                level.items.push(previousItem);
              }

              level.items.push(
                new OSegment(counter++, startSample, durSample, [
                  new OLabel(speaker, transcript),
                  new OLabel('Speaker', speaker),
                ]),
              );
            }
          }
        }
      }
      pointer++;
    }
    if (result.levels.length > 0) {
      for (const level1 of result.levels as OSegmentLevel<OSegment>[]) {
        const lastItem = last(level1.items) as OSegment;

        if (
          lastItem &&
          lastItem.sampleStart + lastItem.sampleDur < audiofile.duration
        ) {
          const gap =
            (audiofile.duration - lastItem.sampleStart) / audiofile.sampleRate;
          if (gap < 1) {
            //less than 1 second > concat
            lastItem.sampleDur = audiofile.duration - lastItem.sampleStart;
          } else {
            // fill gap with empty unit
            const start =
              audiofile.duration - lastItem.sampleStart - lastItem.sampleDur;
            level1.items.push(
              new OSegment(counter++, start, audiofile.duration - start, [
                new OLabel(level1.name, ''),
                new OLabel('Speaker', level1.name),
              ]),
            );
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
