import {AudioInfo} from '../../../../media-components/obj/media/audio';
import * as moment from 'moment';
import {setClassMetadata} from '@angular/core/src/r3_symbols';

abstract class CuttingFormat {
  public abstract exportList(cutList: Segment[], audioInfo: AudioInfo, fileName: string, nameConvention: string);
}

export interface Segment {
  sampleStart: number;
  sampleDur: number;
  transcript: string;
}

export class JSONConverter extends CuttingFormat {
  constructor() {
    super();
  }

  public exportList(cutList: Segment[], audioInfo: AudioInfo, fileName: string, nameConvention: string) {
    const json = {
      meta: {
        creationTime: moment().format(),
        version: '1.0.0',
        audioFile: {
          name: fileName,
          sampleRate: audioInfo.duration.originalSample.sampleRate,
          channels: audioInfo.channels,
          duration: audioInfo.duration.originalSample.value,
          sampleEncoding: audioInfo.duration.originalSample.sampleRate,
          bitRate: audioInfo.bitrate
        }
      },
      segments: []
    };

    for (let i = 0; i < cutList.length; i++) {
      const segment = cutList[i];

      json.segments.push({
        fileName: getNewFileName(nameConvention, fileName, i, cutList, audioInfo),
        sampleStart: segment.sampleStart,
        sampleDur: segment.sampleDur,
        transcript: segment.transcript
      });
    }

    return json;
  }
}

export class TextTableConverter extends CuttingFormat {
  constructor() {
    super();
  }

  public exportList(cutList: Segment[], audioInfo: AudioInfo, fileName: string, nameConvention: string) {
    let text = 'Name\tFile\tSecondsStart\tSecondsDuration\tSampleStart\tSampleDuration\tSampleRate\tTranscript\n';

    for (let i = 0; i < cutList.length; i++) {
      const segment = cutList[i];
      let secondsStart = (segment.sampleStart / audioInfo.duration.originalSample.sampleRate) + '';
      let secondsDuration = (segment.sampleDur / audioInfo.duration.originalSample.sampleRate) + '';

      // set divider to comma separation
      secondsStart = secondsStart.replace(".", ",");
      secondsDuration = secondsDuration.replace(".", ",");
      text += `${getNewFileName(nameConvention, fileName, i, cutList, audioInfo)}\t${fileName}\t${secondsStart}\t${secondsDuration}\t`
        + `${segment.sampleStart}\t${segment.sampleDur}\t${audioInfo.duration.originalSample.sampleRate}`
        + `\t${segment.transcript}\n`;

    }

    return text;
  }
}

export function getNewFileName(namingConvention: string, fileName: string, segmentNumber: number,
                               cutList: Segment[], audioInfo: AudioInfo) {
  const name = fileName.substring(0, fileName.lastIndexOf('.'));
  const extension = fileName.substring(fileName.lastIndexOf('.'));

  let leadingNull = '';
  const maxDecimals = 4;
  const decimals = (segmentNumber + 1).toString().length;


  for (let i = 0; i < maxDecimals - decimals; i++) {
    leadingNull += '0';
  }

  return namingConvention.replace(/<([^<>]+)>/g, (g0, g1) => {
    switch (g1) {
      case('name'):
        return name;
      case('sequNumber'):
        return `${leadingNull}${segmentNumber + 1}`;
      case('sampleStart'):
        return cutList[segmentNumber].sampleStart;
      case('sampleDur'):
        return cutList[segmentNumber].sampleDur;
      case('secondsStart'):
        return Math.round(cutList[segmentNumber].sampleStart / audioInfo.duration.originalSample.sampleRate * 1000) / 1000;
      case('secondsDur'):
        return Math.round(cutList[segmentNumber].sampleDur / audioInfo.duration.originalSample.sampleRate * 1000) / 1000;
    }
    return g1;
  }) + extension;
}
