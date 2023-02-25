/***
 * API Interface which have to be implemented by an API Service
 */

export interface WebTranscribeAnnotation {
  annobegin: string;
  annoend: string;
  annotator: string;
  comment: string;
  id: number;
  jobno: number;
  logtext?: string;
  priority: string;
  prompttext?: string;
  quality?: string;
  segmentbegin: number;
  segmentend: number;
  sesssion: string;
  status: 'ANNOTATED' | 'FREE' | 'BUSY' | 'PAUSED' | 'POSTPONED';
  transcript?: string;
  url: string;
}

export interface WebTranscribeResponse {
  data: WebTranscribeAnnotation;
  message: string;
  systemstate: string;
  type: string;
}

export interface WebTranscribeProjectsListResponse {
  data: string[];
  message: string;
  systemstate: string;
  type: string;
}

export interface WebTranscribePausedResponse {
  message: string;
  systemstate: string;
  type: string;
}

export interface API {
  beginSession(project: string, annotator: string, jobno: number, errorhandler: any, password?: string): Promise<WebTranscribeResponse>;

  fetchAnnotation(id: number): Promise<WebTranscribeResponse>;

  saveSession(transcript: any[],
              project: string,
              annotator: string,
              jobno: number,
              dataID: number,
              status: string,
              comment: string,
              quality: any,
              log: any[]): Promise<any>;

  closeSession(annotator: string, id: number, comment: string): Promise<WebTranscribeResponse>;

  getAudioURL(dir: string, src: string): string;

  post(json: any, errorhandler: any): Promise<any>;
}
