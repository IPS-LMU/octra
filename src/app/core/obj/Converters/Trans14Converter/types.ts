export interface Trans14Topic {
  id: string;
  desc: string;
}

export interface Trans14Speaker {
  id: string;
  name?: string;
  type?: string;
}

export interface Trans14Sync {
  time: string;
}

export interface Trans14Who {
  nb: string;
}

export interface Trans14Event {
  desc: string;
  type?: string;
  extent?: string;
}

interface Trans14Background {
  time: string;
  type: string;
  level: string;
}

export interface Trans14Turn {
  speaker?: string;
  startTime: string;
  endTime: string;
  text?: string;
}

export interface Trans14Section {
  type?: string;
  topic?: string;
  startTime: string;
  endTime: string;
}

export interface Trans14Root {
  version?: string;
  version_date?: string;
  audio_filename?: string;
  scribe?: string;
  'xml:lang'?: string;
  'elapsed_time'?: string;
}

export interface Trans14Episode {
  program?: string;
  air_date?: string;
}

/*
  Episode?:
 */
