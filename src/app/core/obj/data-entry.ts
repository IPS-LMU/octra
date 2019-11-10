export interface TranscriptItem {
  start: number;
  length: number;
  text: string;
}

export interface IDataEntry {
  id: number;
  annotator: string;
  project: string;
  url: string;
  annobegin: string;
  annoend: string;
  prompttext: string;
  transcript: TranscriptItem[];
  quality: {
    'quality-speaker': string;
    'quality-audio': string;
  };
  segmentbegin: null;
  segmentend: null;
  comment: string;
  priority: any;
  status: string;
  annotype: any;
  logtext: {
    type: string;
    message: string;
    context: string;
    timestamp: number;
    value: string;
    targetname: string;
    playpos: number;
    caretpos: number;
  }[];
  jobno: number;
  itemcode: any;
  filesize: any;
  samplerate: number;
  samples: null;
  nextannotation_id: number;
  admincomment: string;
}

export function parseServerDataEntry(result: string): IDataEntry {
  return JSON.parse(result, (key, value) => {
    if (key === 'transcript') {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } else if (key === 'quality') {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value;
    } else if (key === 'logtext') {
      try {
        if (typeof value === 'string') {
          const logs = JSON.parse(value.replace(/\\"/g, '"'));
          logs.sort((a, b) => {
            if (a.timestamp === b.timestamp) {
              return 0;
            }

            return (a.timestamp < b.timestamp) ? -1 : 0;
          });
          return logs;
        } else {
          value.sort((a, b) => {
            if (a.timestamp === b.timestamp) {
              return 0;
            }

            return (a.timestamp < b.timestamp) ? -1 : 0;
          });
          return value;
        }
      } catch (e) {
        return null;
      }
    }

    return value;
  });
}
