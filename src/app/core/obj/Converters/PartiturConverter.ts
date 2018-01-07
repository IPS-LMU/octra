import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OItem, OLabel, OLevel, OSegment} from '../Annotation/AnnotJSON';
import {isNullOrUndefined} from 'util';

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

    if (!isNullOrUndefined(levelnum)) {
      const result: ExportResult = {
        file: {
          name: `${annotation.name}-${annotation.levels[levelnum].name}${this._extension}`,
          content: 'SAM ' + audiofile.samplerate,
          encoding: 'UTF-8',
          type: 'text'
        }
      };
      let content = `LHD: Partitur 1.3
SAM: ${audiofile.samplerate}
NCH: 1
LBD:\n`;

      let ort = [];
      const trn = [];

      let ort_counter = 0;

      for (let i = 0; i < annotation.levels[levelnum].items.length; i++) {
        const item = annotation.levels[levelnum].items[i];
        const words = item.labels[0].value.split(' ');
        ort = ort.concat(words);
        let trn_line = `TRN: ${item.sampleStart} ${item.sampleDur} `;

        for (let j = 0; j < words.length; j++) {
          trn_line += `${ort_counter + j}`;
          if (j < words.length - 1) {
            trn_line += ',';
          }
        }
        ort_counter += words.length;
        trn_line += ` ${item.labels[0].value}\n`;
        trn.push(trn_line);
      }

      for (let i = 0; i < ort.length; i++) {
        content += `ORT: ${i} ${ort[i]}\n`;
      }
      for (let i = 0; i < trn.length; i++) {
        content += trn[i];
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
      // const sam_found = lines[pointer].match(/SAM: ([0-9]+)/);
      /*
      if (isNullOrUndefined(sam_found)) {
        console.error(this._name + ' Converter Error: samplerate not found in .par file');
        return null;
      }
      const samplerate = Number(sam_found[1]);


      if (samplerate !== audiofile.samplerate) {
        console.error(this._name + ' Converter Error: samplerate of audiofile is not equal with samplerate of .par file.');
        return null;
      }
      pointer++;
      */

      const result = new OAnnotJSON(audiofile.name, audiofile.samplerate);
      const tiers = {};

      // skip not needed information and read needed information
      let previous_tier = '';
      let level = null;
      let counter = 1;
      const start = 0;
      while (pointer < lines.length) {
        const search = lines[pointer].match(
          new RegExp(
            '(SAM)|(KAN)|(ORT)|(DAS)|(TR2)|(SUP)|(PRS)|(NOI)|(LBP)|(LBG)|(PRO)|(POS)|(LMA)|(SYN)|(FUN)|(LEX)|' +
            '(IPA)|(TRN)|(TRS)|(GES)|(USH)|(USM)|(OCC)|(USP)|(GES)|(TLN)|(PRM)|(TRW)|(MAS)'));
        if (!isNullOrUndefined(search)) {
          const columns = lines[pointer].split(' ');

          if (search[0] === 'SAM') {
            console.log(`SAM found with: ${columns[1]}`);
            if (audiofile.samplerate !== Number(columns[1])) {
              console.error(`Sample Rate of audio file is not equal to the value from Partitur file!`);
            }
          }

          if (search[0] === 'TRN') {
            if (previous_tier !== search[0]) {
              if (level !== null) {
                result.levels.push(level);
              }
              level = (search[0] !== 'TRN') ? new OLevel(search[0], 'ITEM', []) : new OLevel(search[0], 'SEGMENT', []);
              previous_tier = search[0];
              tiers[`${previous_tier}`] = [];
            }
            if (previous_tier !== 'TRN') {
              level.items.push(new OItem(counter, [new OLabel(previous_tier, columns[2])]));
              tiers[`${previous_tier}`].push(columns[2]);
            } else {
              const transcript = lines[pointer].match(new RegExp('TRN: ([0-9]+) ([0-9]+) ([0-9]+,?)+ (.*)'));
              level.items.push(new OSegment(
                counter, Number(transcript[1]), Number(transcript[2]) + 1, [new OLabel(previous_tier, transcript[4])]
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
        audiofile: null
      };
    }

    return null;
  }
}
