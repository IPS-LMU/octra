import {Converter, ExportResult, IFile, ImportResult} from './Converter';
import {OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment} from '../Annotation/AnnotJSON';

export class WebVTTConverter extends Converter {

  public constructor() {
    super();
    this._application = 'Videoplayer';
    this._name = 'WebVTT Subtitles';
    this._extension = '.vtt';
    this._website.title = 'Web Video Text Tracks Format (WebVTT)\n';
    this._website.url = 'https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API';
    this._conversion.export = true;
    this._conversion.import = true;
    this._encoding = 'UTF-8';
    this._multitiers = false;
  }

  public export(annotation: OAnnotJSON, audiofile: OAudiofile, levelnum: number): ExportResult {
    let result = 'WEBVTT\n\n';
    let filename = '';

    if (!(levelnum === null || levelnum === undefined) && levelnum < annotation.levels.length) {
      const level: OLevel = annotation.levels[levelnum];

      let counter = 1;
      if (level.type === 'SEGMENT') {
        for (let j = 0; j < level.items.length; j++) {
          const transcript = level.items[j].labels[0].value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          const start = this.getTimeStringFromSamples(level.items[j].sampleStart, annotation.sampleRate);
          const end = this.getTimeStringFromSamples(level.items[j].sampleStart + level.items[j].sampleDur, annotation.sampleRate);

          if (transcript !== '') {
            result += `${counter}\n`;
            result += `${start} --> ${end}\n`;
            result += `${transcript}\n\n`;
            counter++;
          }
        }
      }

      filename = `${annotation.name}`;
      if (annotation.levels.length > 1) {
        filename += `-${level.name}`;
      }
      filename += `${this._extension}`;
    } else {
      console.error('SRTConverter needs a level number');
      return null;
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
      const olevel = new OLevel('OCTRA_1', 'SEGMENT');

      let counterID = 1;
      if (content !== '') {
        const regex = new RegExp('([0-9]+)\n([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}) --> ([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3})\n' +
          '((?:(?:(?![0-9]).+)?\n?)+)', 'g');

        let matches = regex.exec(content);
        let lastEnd = 0;
        while (matches !== null) {
          const timeStart = this.getSamplesFromTimeString(matches[2], audiofile.samplerate);
          const timeEnd = this.getSamplesFromTimeString(matches[3], audiofile.samplerate);
          const segmentContent = matches[4].replace(/NOTE[^\n]+\n/g, '').replace(/(\n|\s)+$/g, '')
            .replace('&lt;', '<').replace('&gt;', '>');

          if (timeStart > lastEnd) {
            // add additional segment
            olevel.items.push(new OSegment(
              counterID++, lastEnd, timeStart - lastEnd, [new OLabel('OCTRA_1', '')]
            ));
          }

          olevel.items.push(new OSegment(
            counterID++, timeStart, timeEnd - timeStart, [new OLabel('OCTRA_1', segmentContent)]
          ));

          matches = regex.exec(content);
          lastEnd = timeEnd;
        }
      }

      if (olevel.items.length > 0) {
        // set last segment duration to fit last sample
        const lastSegment = olevel.items[olevel.items.length - 1];
        olevel.items[olevel.items.length - 1].sampleDur = Number(audiofile.duration) - Number(lastSegment.sampleStart);
      }

      console.log(olevel);
      result.levels.push(olevel);

      return {
        annotjson: result,
        audiofile: null,
        error: ''
      };
    }

    return {
      annotjson: null,
      audiofile: null,
      error: 'This WebVTT file is not compatible with this audio file.'
    };
  }

  public getTimeStringFromSamples(samples: number, sampleRate: number) {
    const miliseconds = Math.round(samples / sampleRate * 1000);
    const seconds = Math.floor(miliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const miliStr = this.formatNumber(miliseconds % 1000, 3);
    const secondsStr = this.formatNumber(seconds % 60, 2);
    const minutesStr = this.formatNumber(minutes % 60, 2);
    const hoursStr = this.formatNumber(hours, 2);

    return `${hoursStr}:${minutesStr}:${secondsStr}.${miliStr}`;
  }

  public getSamplesFromTimeString(timeString: string, sampleRate: number) {
    if (sampleRate > 0) {
      const regex = new RegExp(/([0-9]+):([0-9]+):([0-9]+).([0-9]+)/g);

      const matches = regex.exec(timeString);

      if (matches.length > -1) {
        const hours = Number(matches[1]);
        const minutes = Number(matches[2]);
        const seconds = Number(matches[3]);
        const miliseconds = Number(matches[4]);

        let totalMiliSeconds = hours * 60 * 60;
        totalMiliSeconds += minutes * 60;
        totalMiliSeconds += seconds;
        totalMiliSeconds *= 1000;
        totalMiliSeconds += miliseconds;
        totalMiliSeconds = Math.round(totalMiliSeconds);

        return Math.round(totalMiliSeconds / 1000 * sampleRate);
      } else {
        console.error(`time string does not match`);
      }
    } else {
      console.error(`invalid sample rate`);
    }
  }


  public formatNumber = (num, length): string => {
    let result = '' + num.toFixed(0);
    while (result.length < length) {
      result = '0' + result;
    }
    return result;
  }
}
