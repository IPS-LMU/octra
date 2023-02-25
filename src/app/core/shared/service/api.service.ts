import {Injectable, SecurityContext} from '@angular/core';
import {API, WebTranscribePausedResponse, WebTranscribeProjectsListResponse, WebTranscribeResponse} from '../../obj/API/api.interface';
import {DomSanitizer} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {isNullOrUndefined} from '../Functions';
import * as moment from 'moment';

@Injectable()
export class APIService implements API {
  private serverURL = '';

  constructor(private http: HttpClient,
              private sanitizer: DomSanitizer) {
  }

  public async beginSession(project: string, annotator: string, jobno: number, password?: string): Promise<WebTranscribeResponse> {
    // validation
    if (project !== '' && (annotator !== '')) {

      const cmdJSON = {
        querytype: 'startannotation',
        annotator,
        project,
        jobno
      };

      return this.post(cmdJSON);
    }
    throw new Error('beginSession - validation false');
  }

  public async fetchAnnotation(id: number): Promise<WebTranscribeResponse> {
    const cmdJSON = {
      querytype: 'fetchannotation',
      id
    };
    return this.post(cmdJSON);
  }

  public async pauseSession(transcript: any[], project: string, annotator: string, jobno: number, dataID: number,
                            status: string, comment: string, quality: any, log: any[]): Promise<WebTranscribePausedResponse> {
    if (
      project !== '' &&
      transcript.length > 0
    ) {
      const cmdJSON = {
        querytype: 'pauseannotation',
        transcript: JSON.stringify(transcript),
        project,
        annotator,
        comment,
        jobno,
        status: 'PAUSED',
        quality,
        id: dataID,
        log
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('pauseSession - validation false');
    }
  }

  public async saveSession(transcript: any[], project: string, annotator: string, jobno: number, dataID: number,
                           status: string, comment: string, quality: any, log: any[]): Promise<WebTranscribeResponse> {
    if (
      project !== '' &&
      transcript.length > 0 &&
      quality !== null
    ) {
      const cmdJSON = {
        querytype: 'continueannotation',
        transcript: JSON.stringify(transcript),
        project,
        annotator,
        comment,
        jobno,
        status,
        quality,
        id: dataID,
        log
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('saveSession - validation false');
    }
  }

  public async failSession(dataID: number, errorMessage: string): Promise<any> {
    const date = moment().toISOString(false);
    return this.post({
      querytype: 'continueannotation',
      status: 'FAILED',
      comment: `${date}: ${errorMessage}`,
      id: dataID
    });
  }

  public async closeSession(annotator: string, id: number, comment: string): Promise<WebTranscribeResponse> {
    comment = (comment) ? comment : '';

    if (
      annotator !== null &&
      id !== null && id > -1) {
      const cmdJSON = {
        querytype: 'endannotation',
        annotator,
        comment,
        id
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('closeSession - validation false');
    }
  }

  public getAudioURL(dir: string, src: string): string {
    if (
      dir !== null && dir !== '' &&
      src !== null && src !== ''
    ) {
      dir = this.sanitizer.sanitize(SecurityContext.URL, dir);
      src = this.sanitizer.sanitize(SecurityContext.URL, src);

      return this.serverURL + '?dir=' + dir + '&src=' + src;
    } else {
      throw new Error('getAudioBuffer - validation false');
    }
  }

  public async getProjects(): Promise<WebTranscribeProjectsListResponse> {
    const cmdJSON = {
      querytype: 'listprojects'
    };

    return new Promise<any>((resolve, reject) => {
      let checked = false;

      setTimeout(() => {
        checked = true;
        reject(new Error('API timeout: server does not answer.'));
      }, 2000);

      this.post(cmdJSON).then((result) => {
        if (!checked) {
          resolve(result);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  public async post(json: any): Promise<any> {
    const body = JSON.stringify(json);

    return new Promise<void>((resolve, reject) => {
      this.http.post(this.serverURL, body, {
        responseType: 'json'
      }).subscribe((obj) => {
          resolve(obj as any);
        },
        (err) => {
          reject(err);
        });
    });
  }

  public init(serverURL: string) {
    this.serverURL = this.sanitizer.sanitize(SecurityContext.URL, serverURL);
  }

  public async sendBugReport(email: string = '', description: string = '', log: any): Promise<any> {
    const json = JSON.stringify(log);

    const cmdJSON = {
      querytype: 'reportbug',
      email,
      buglogtext: json
    };

    return this.post(cmdJSON);
  }

  public setOnlineSessionToFree: (appStorageService) => Promise<void> = async (appStorage) => {
    // check if old annotation is already annotated
    return new Promise<void>((resolve, reject) => {
      if (!isNullOrUndefined(appStorage.dataID) && appStorage.dataID > -1) {
        this.fetchAnnotation(appStorage.dataID).then((json) => {
          if (!isNullOrUndefined(json) && !isNullOrUndefined(json.data)) {
            if (json.data.hasOwnProperty('status') && json.data.status === 'BUSY') {
              this.closeSession(appStorage.user.id, appStorage.dataID, '').then(() => {
                resolve();
              }).catch((error) => {
                reject(error);
              });
            } else {
              resolve();
            }
          } else {
            // json data is null or undefined, ignore
            resolve();
          }
        }).catch((error) => {
          console.error(error);
        });
      } else {
        resolve();
      }
    });
  };
}
