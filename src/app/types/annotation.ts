import {isNullOrUndefined} from 'util';
export interface IAnnotation {
  version: string;
  annotator: string;
  date: string;
  audiofile: IAudioFile;
  tiers: ITier[];
}

export interface ITier {
  name: string;
  segments: ISegment[];
}

export interface ISegment {
  start: number;
  length: number;
  transcript: string;
}

export interface IAudioFile {
  name: string;
  size: number;
  duration: number;
  samplerate: number;
}

/*
 CLASSES
 Classes that are just container to build their interfaces
 */

export class OAnnotation implements IAnnotation {
  version: string;
  annotator: string;
  date: string;
  audiofile: OAudiofile;
  tiers: OTier[];

  constructor(annotator = '', tiers?: ITier[], audiofile?: IAudioFile) {
    this.annotator = annotator;
    this.tiers = [];
    this.audiofile = new OAudiofile();

    if (!isNullOrUndefined(tiers)) {
      this.tiers = tiers;
    }
    if (!isNullOrUndefined(audiofile)) {
      this.audiofile = audiofile;
    }
  }
}

export class OAudiofile implements IAudioFile {
  name: string;
  size: number;
  duration: number;
  samplerate: number;

  constructor() {
  }
}

export class OTier implements ITier {
  name: string;
  segments: OSegment[];

  constructor() {
  }
}

export class OSegment implements ISegment {
  start: number;
  length: number;
  transcript: string;

  constructor(start: number, length: number, transcript: string) {
    this.start = start;
    this.length = length;
    this.transcript = transcript;
  }
}

