export interface IAnnotJSON {
  name: string;
  annotates: string;
  sampleRate: number;
  levels: ILevel[];
  links: ILink[];
}

export interface ILevel {
  name: string;
  type: AnnotationLevelType;
  items: IItem[];
}

export interface IItem {
  id: number;
  sampleStart?: number;
  sampleDur?: number;
  samplePoint?: number;
  labels: ILabel[];
}

export interface ISegment extends IItem {
  sampleStart: number;
  sampleDur: number;
}

export interface IEvent extends IItem {
  samplePoint: number;
}

export interface ILabel {
  name: string;
  value: string;
}

export interface ILink {
  fromID: number;
  toID: number;
}

export interface IAudioFile {
  name: string;
  size: number;
  duration: number;
  sampleRate: number;
  url: string;
  type: string;
}

/*
 CLASSES
 Classes that are just container to build their interfaces
 */

export class OAnnotJSON implements IAnnotJSON {
  name = '';
  annotates = '';
  sampleRate;
  levels: OLevel[] = [];
  links: OLink[] = [];

  constructor(audioFile: string, sampleRate: number, levels?: ILevel[], links?: ILink[]) {
    this.annotates = audioFile;
    this.name = audioFile;
    this.sampleRate = sampleRate;

    if (audioFile.lastIndexOf('.') > -1) {
      this.name = audioFile.substr(0, audioFile.lastIndexOf('.'));
    }

    if (!(levels === null || levels === undefined)) {
      this.levels = levels;
    }

    if (!(links === null || links === undefined)) {
      this.links = links;
    }
  }
}
// TODO add extension and use name without it
export class OAudiofile implements IAudioFile {
  name: string;
  // need type attribute
  arraybuffer: ArrayBuffer;
  size: number;
  duration: number;
  sampleRate: number;
  url: string;
  type: string;
}

export class OLevel implements ILevel {
  name = '';
  type;
  items: IItem[];

  constructor(name: string, type: string, items?: IItem[]) {
    this.name = name;
    this.type = type;
    this.items = [];

    if (!(items === null || items === undefined)) {
      this.items = items;
    }
  }
}

export class OItem implements IItem {
  id = 0;
  labels: OLabel[];

  constructor(id: number, labels?: ILabel[]) {
    this.id = id;

    this.labels = [];
    if (!(labels === null || labels === undefined)) {
      this.labels = labels;
    }
  }
}

export class OSegment extends OItem {
  sampleStart = 0;
  sampleDur = 0;

  constructor(id: number, sampleStart: number, sampleDur: number, labels?: ILabel[]) {
    super(id, labels);
    this.sampleStart = sampleStart;
    this.sampleDur = sampleDur;
  }
}

export class OEvent extends OItem {
  samplePoint;

  constructor(id: number, samplePoint: number, labels?: ILabel[]) {
    super(id, labels);
    this.samplePoint = samplePoint;
  }
}

export class OLabel implements ILabel {
  name = '';
  value = '';

  constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }
}

export class OLink implements ILink {
  fromID: number;
  toID: number;

  constructor(fromID: number, toID: number) {
    this.fromID = fromID;
    this.toID = toID;
  }
}

export enum AnnotationLevelType {
  ITEM = 'ITEM',
  EVENT = 'EVENT',
  SEGMENT = 'SEGMENT'
}
