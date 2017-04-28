import {Converter} from './Converter';

export class TextConverter extends Converter {

  public convert(data: any, filename: string): any {
    let result = '';

    for (let i = 0; i < data.transcript.length; i++) {
      result += data.transcript[i].text;
      if (i < data.transcript.length - 1) {
        result += ' ';
      }
    }

    return result;
  }
}
