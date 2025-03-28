import { OAudiofile } from '@octra/media';
import { FileInfo } from '@octra/web-media';
import {
  OAnnotJSON,
  OItem,
  OItemLevel,
  OLabel,
  OSegment,
  OSegmentLevel,
} from '../annotjson';
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
    this._multitiers = false;
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

    if (levelnum !== undefined && levelnum > -1) {
      const result: ExportResult = {
        file: {
          name: `${annotation.name}-${annotation.levels[levelnum].name}${this._extensions[0]}`,
          content: 'SAM ' + audiofile.sampleRate,
          encoding: 'UTF-8',
          type: 'text',
        },
      };
      let content = `LHD: Partitur 1.3
SAM: ${audiofile.sampleRate}
NCH: 1
LBD:\n`;

      let ort: any[] = [];
      const trn = [];

      let ortCounter = 0;

      for (const item of annotation.levels[levelnum].items as OSegment[]) {
        const words = (
          item.getFirstLabelWithoutName('Speaker')?.value ?? ''
        ).split(' ');
        ort = ort.concat(words);
        let trnLine = `TRN: ${item.sampleStart} ${item.sampleDur} `;

        for (let j = 0; j < words.length; j++) {
          trnLine += `${ortCounter + j}`;
          if (j < words.length - 1) {
            trnLine += ',';
          }
        }
        ortCounter += words.length;
        trnLine += ` ${
          item.getFirstLabelWithoutName('Speaker')?.value ?? ''
        }\n`;
        trn.push(trnLine);
      }

      for (let i = 0; i < ort.length; i++) {
        content += `ORT: ${i} ${ort[i]}\n`;
      }

      for (const trnElement of trn) {
        content += trnElement;
      }

      result.file!.content = content;

      return result;
    } else {
      // levelnum is undefined;
      return {
        error: 'BASPartitur Converter needs a level number for export',
      };
    }
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
    const tiers: any = {};

    // skip not needed information and read needed information
    let previousTier = '';
    let level: OSegmentLevel<OSegment> | OItemLevel | undefined = undefined;
    let counter = 1;
    while (pointer < lines.length) {
      const search = lines[pointer].match(
        new RegExp(
          '^((LHD)|(SAM)|(KAN)|(ORT)|(DAS)|(TR2)|(SUP)|(PRS)|(NOI)|(LBP)|(LBG)|(PRO)|(POS)|(LMA)|(SYN)|(FUN)|(LEX)|' +
            '(IPA)|(TRN)|(TRS)|(GES)|(USH)|(USM)|(OCC)|(USP)|(GES)|(TLN)|(PRM)|(TRW)|(MAS))',
          'g',
        ),
      );

      if (search) {
        const columns = lines[pointer].split(' ');

        if (search[0] === 'SAM') {
          if (audiofile.sampleRate !== Number(columns[1])) {
            console.error(
              `Sample Rate of audio file is not equal to the value from Partitur` +
                ` file! ${audiofile.sampleRate} !== ${columns[1]}`,
            );
          }
        }

        if (search[0] === 'TRN') {
          if (previousTier !== search[0]) {
            if (level !== undefined) {
              result.levels.push(level);
            }
            level =
              search[0] !== 'TRN'
                ? new OItemLevel(search[0])
                : new OSegmentLevel(search[0]);
            previousTier = search[0];
            tiers[`${previousTier}`] = [];
          }
          if (previousTier !== 'TRN') {
            if (level === undefined) {
              return {
                annotjson: result,
                audiofile: undefined,
                error: 'A level is missing.',
              };
            }
            (level.items as OItem[]).push(
              new OItem(counter, [new OLabel(previousTier, columns[2])]),
            );
            tiers[`${previousTier}`].push(columns[2]);
          } else {
            const transcript = lines[pointer];
            const transcriptArray = transcript.match(
              /TRN:\s([0-9]+)\s([0-9]+)\s([0-9]+,?)+ (.*)/,
            );

            if (level === undefined) {
              return {
                annotjson: result,
                audiofile: undefined,
                error: 'A level is missing.',
              };
            }

            if (transcriptArray) {
              level.items.push(
                new OSegment(
                  counter,
                  Number(transcriptArray[1]),
                  Number(transcriptArray[2]),
                  [new OLabel(previousTier, transcriptArray[4])],
                ),
              );
            }
          }

          counter++;
        }
      }
      pointer++;
    }
    if (level) {
      result.levels.push(level);
      return {
        annotjson: result,
        audiofile: undefined,
        error: '',
      };
    } else {
      return {
        annotjson: undefined,
        audiofile: undefined,
        error: `Input file not compatible with Praat Partitur.`,
      };
    }
  }
}
