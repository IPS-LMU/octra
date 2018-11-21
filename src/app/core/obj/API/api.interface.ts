/***
 * API Interface which have to be implemented by an API Service
 */
export interface API {
  beginSession(project: string, annotator: string, jobno: number, errorhandler: any, password?: string): Promise<any>;

  continueSession(project: string, annotator: string, jobno: number, errorhandler: any): Promise<any>;

  fetchAnnotation(id: number): Promise<any>;

  saveSession(transcript: any[],
              project: string,
              annotator: string,
              jobno: number,
              data_id: number,
              status: string,
              comment: string,
              quality: any,
              log: any[]): Promise<any>;

  lockSession(transcript: any[],
              project: string,
              annotator: string,
              jobno: number,
              data_id: number,
              comment: string,
              quality: any,
              log: any[]): Promise<any>;

  unlockSession(project: string,
                data_id: number): Promise<any>;

  closeSession(annotator: string, id: number, comment: string): Promise<any>;

  getAudioURL(dir: string, src: string): string;

  post(json: any, errorhandler: any): Promise<any>;
}
