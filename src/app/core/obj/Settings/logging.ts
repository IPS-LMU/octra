export interface ILogging {
  version: string;
  encoding: string; // Bsp.: "UTF-8"
  projectname: string; // Bsp.: "test"
  lastupdate: string; // Bsp.: "2017-06-26 13:00"
  audiofile: string;
  duration: number;
  sampleRate: number;
  logs: ILog[];
}

export interface ILog {
  timestamp: number; // Unix Timestamp
  type: string;
  context: string; // Ziel der Aktion/betroffenes Control
  value: string | number | any;
  playpos: number; // Samples
  caretpos: number; // Position des Cursors im// Text (wird Caret genannt)
  selection?: {
    start: number;
    length: number;
  },
  segment?: {
    start: number;
    length: number;
  }
}

export class OLogging implements ILogging {
  version: string;
  encoding: string; // Bsp.: "UTF-8"
  projectname: string; // Bsp.: "test"
  lastupdate: string; // Bsp.: "2017-06-26 13:00"
  audiofile: string;
  duration: number;
  sampleRate: number;
  logs: ILog[];

  constructor(version: string, encoding: string, projectname: string, lastupdate: string, audiofile: string,
              sampleRate: number, duration: number, logs: OLog[]) {
    this.version = version;
    this.encoding = encoding;
    this.projectname = projectname;
    this.lastupdate = lastupdate;
    this.duration = duration;
    this.sampleRate = sampleRate;
    this.audiofile = audiofile;
    this.logs = logs;
  }

  getObj() {
    return JSON.parse(JSON.stringify(this.logs));
  }
}

export class OLog implements ILog {
  timestamp: number; // Unix Timestamp
  type: string;
  context: string; // Ziel der Aktion/betroffenes Control
  value: string | number | any;
  playpos: number; // Samples
  caretpos: number; // Position des Cursors im Text (wird Caret genannt)
  selection: {
    start: number;
    length: number
  };
  segment: {
    start: number;
    length: number
  };

  constructor(timestamp: number, type: string, context: string, value: any, playpos: number, caretpos: number,
              selection?: {
                start: number;
                length: number;
              }, segment?: {
      start: number;
      length: number;
    }) {
    this.timestamp = timestamp;
    this.type = type;
    this.context = context;
    this.value = value;
    this.playpos = playpos;
    this.caretpos = caretpos;
    this.selection = selection;
    this.segment = segment;

    if (selection === null) {
      delete this.selection;
    }
    if (segment === null) {
      delete this.segment;
    }

    if (caretpos < 0) {
      delete this.caretpos;
    }
    if (caretpos < 0) {
      delete this.caretpos;
    }
  }
}
