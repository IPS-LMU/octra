export interface ILogging {
  version: string;
  encoding: string; // Bsp.: "UTF-8"
  projectname: string; // Bsp.: "test"
  lastupdate: string; // Bsp.: "2017-06-26 13:00"
  audiofile: string;
  duration: number;
  samplerate: number;
  logs: ILog[];
}

export interface ILog {
  timestamp: number; // Unix Timestamp
  type: string;
  context: string; // Ziel der Aktion/betroffenes Control
  value: string | number | any;
  playerpos: number; // Samples
  caretpos: number; // Position des Cursors im// Text (wird Caret genannt)
}

export class OLogging implements ILogging {
  version: string;
  encoding: string; // Bsp.: "UTF-8"
  projectname: string; // Bsp.: "test"
  lastupdate: string; // Bsp.: "2017-06-26 13:00"
  audiofile: string;
  duration: number;
  samplerate: number;
  logs: ILog[];

  constructor(version: string, encoding: string, projectname: string, lastupdate: string, audiofile: string,
              samplerate: number, duration: number, logs: OLog[]) {
    this.version = version;
    this.encoding = encoding;
    this.projectname = projectname;
    this.lastupdate = lastupdate;
    this.duration = duration;
    this.samplerate = samplerate;
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
  playerpos: number; // Samples
  caretpos: number; // Position des Cursors im Text (wird Caret genannt)

  constructor(timestamp: number, type: string, context: string, value: any, playerpos: number, caretpos: number) {
    this.timestamp = timestamp;
    this.type = type;
    this.context = context;
    this.value = value;
    this.playerpos = playerpos;
    this.caretpos = caretpos;
  }
}
