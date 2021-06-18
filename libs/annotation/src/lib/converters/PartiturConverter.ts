import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OItem, OLabel, OLevel, OSegment} from '../annotjson';

export class PartiturConverter extends Converter {

  public constructor() {
    super();
    this._application = '';
    this._name = 'BAS Partitur Format';
    this._extension = '.par';
    this._website.title = 'BAS Partitur Format';
    this._website.url = 'http://www.bas.uni-muenchen.de/Bas/BasFormatsdeu.html';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._notice = 'While importing a .par file OCTRA combines TRN and ORT lines to one tier. ' +
      'This tier only consists of time aligned segments. For export OCTRA creates ORT and TRN lines from the transcription.';
    this._multitiers = false;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    if (annotation === undefined) {
      // annotation is null;
      console.error('BASPartitur Converter annotation is null');
      return null;
    }
    if (!(levelnum === null || levelnum === undefined)) {
      const result: ExportResult = {
        file: {
          name: `${annotation.name}-${annotation.levels[levelnum].name}${this._extension}`,
          content: 'SAM ' + audiofile.sampleRate,
          encoding: 'UTF-8',
          type: 'text'
        }
      };
      let content = `LHD: Partitur 1.3
SAM: ${audiofile.sampleRate}
NCH: 1
LBD:\n`;

      let ort = [];
      const trn = [];

      let ortCounter = 0;

      for (const item of annotation.levels[levelnum].items) {
        const words = item.labels[0].value.split(' ');
        ort = ort.concat(words);
        let trnLine = `TRN: ${item.sampleStart} ${item.sampleDur} `;

        for (let j = 0; j < words.length; j++) {
          trnLine += `${ortCounter + j}`;
          if (j < words.length - 1) {
            trnLine += ',';
          }
        }
        ortCounter += words.length;
        trnLine += ` ${item.labels[0].value}\n`;
        trn.push(trnLine);
      }

      for (let i = 0; i < ort.length; i++) {
        content += `ORT: ${i} ${ort[i]}\n`;
      }

      for (const trnElement of trn) {
        content += trnElement;
      }

      result.file.content = content;

      return result;
    } else {
      // levelnum is null;
      console.error('BASPartitur Converter needs a level number for export');
      return null;
    }
  }

  public import(file: IFile, audiofile: OAudiofile): ImportResult {
    if (audiofile !== null && audiofile !== undefined) {
      const lines = file.content.split(/\r?\n/g);
      let pointer = 0;

      const result = new OAnnotJSON(audiofile.name, audiofile.sampleRate);
      const tiers = {};

      // skip not needed information and read needed information
      let previousTier = '';
      let level = null;
      let counter = 1;
      while (pointer < lines.length) {
        const search = lines[pointer].match(
          new RegExp('^((LHD)|(SAM)|(KAN)|(ORT)|(DAS)|(TR2)|(SUP)|(PRS)|(NOI)|(LBP)|(LBG)|(PRO)|(POS)|(LMA)|(SYN)|(FUN)|(LEX)|' +
            '(IPA)|(TRN)|(TRS)|(GES)|(USH)|(USM)|(OCC)|(USP)|(GES)|(TLN)|(PRM)|(TRW)|(MAS))', 'g'));

        if (!(search === null || search === undefined)) {
          const columns = lines[pointer].split(' ');

          if (search[0] === 'SAM') {
            if (audiofile.sampleRate !== Number(columns[1])) {
              console.error(`Sample Rate of audio file is not equal to the value from Partitur` +
                ` file! ${audiofile.sampleRate} !== ${columns[1]}`);
            }
          }

          if (search[0] === 'TRN') {
            if (previousTier !== search[0]) {
              if (level !== null) {
                result.levels.push(level);
              }
              level = (search[0] !== 'TRN') ? new OLevel(search[0], 'ITEM', []) : new OLevel(search[0], 'SEGMENT', []);
              previousTier = search[0];
              tiers[`${previousTier}`] = [];
            }
            if (previousTier !== 'TRN') {
              if (level === null) {
                return {
                  annotjson: result,
                  audiofile: null,
                  error: 'A level is missing.'
                };
              }
              level.items.push(new OItem(counter, [new OLabel(previousTier, columns[2])]));
              tiers[`${previousTier}`].push(columns[2]);
            } else {
              const transcript = lines[pointer];
              const transcriptArray = transcript.match(/TRN:\s([0-9]+)\s([0-9]+)\s([0-9]+,?)+ (.*)/);

              if (level === null) {
                return {
                  annotjson: result,
                  audiofile: null,
                  error: 'A level is missing.'
                };
              }

              level.items.push(new OSegment(
                counter, Number(transcriptArray[1]), Number(transcriptArray[2]), [new OLabel(previousTier, transcriptArray[4])]
                )
              );
            }

            counter++;
          }
        }
        pointer++;
      }
      result.levels.push(level);

      return {
        annotjson: result,
        audiofile: null,
        error: ''
      };
    }

    return {
      annotjson: null,
      audiofile: null,
      error: `This Partitur file is not compatble with this audio file.`
    };
  }
}
