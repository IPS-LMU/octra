import {Injectable, SecurityContext} from '@angular/core';
import {API} from '../../obj/API/api.interface';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import {isNullOrUndefined} from '../Functions';

@Injectable()
export class APIService implements API {
  private server_url = '';

  constructor(private http: HttpClient,
              private sanitizer: DomSanitizer) {
  }

  public beginSession(project: string, annotator: string, jobno: number, password?: string): Promise<any> {
    // validation
    if (project !== '' && (annotator !== '')) {

      const cmd_json = {
        querytype: 'startannotation',
        annotator: annotator,
        project: project,
        jobno: jobno
      };

      return this.post(cmd_json);
    }
    throw new Error('beginSession - validation false');
  }

  public continueSession(project: string, annotator: string, jobno: number): Promise<any> {
    if (project !== null && project !== '' &&
      annotator !== null && annotator !== ''
    ) {
      const cmd_json = {
        querytype: 'continueannotation',
        project: project,
        annotator: annotator,
        jobno: jobno
      };
      return this.post(cmd_json);
    } else {
      throw new Error('continueSession - validation false');
    }
  }

  public fetchAnnotation(id: number): Promise<any> {
    const cmd_json = {
      querytype: 'fetchannotation',
      id: id
    };
    return this.post(cmd_json);
  }

  public lockSession(transcript: any[], project: string, annotator: string, jobno: number,
                     data_id: number, comment: string, quality: any, log: any[]): Promise<any> {
    if (
      project !== '' &&
      transcript.length > 0 &&
      quality !== null
    ) {
      const cmd_json = {
        querytype: 'continueannotation',
        transcript: JSON.stringify(transcript),
        project: project,
        annotator: annotator,
        comment: comment,
        jobno: jobno,
        status: 'BUSY',
        quality: JSON.stringify(quality),
        id: data_id,
        log: log
      };

      return this.post(cmd_json);
    } else {
      throw new Error('saveSession - validation false');
    }
  }

  /**
   * this method doesn't work! Do not use it.
   * @param project
   * @param data_id
   * @returns {Observable<any>}
   */
  public unlockSession(project: string,
                       data_id: number): Promise<any> {
    if (
      project !== ''
    ) {
      const cmd_json = {
        querytype: 'continueannotation',
        transcript: '',
        project: project,
        annotator: '',
        comment: '',
        status: 'FREE',
        quality: '',
        id: data_id,
        log: []
      };

      return this.post(cmd_json);
    } else {
      throw new Error('unlockSession - validation false');
    }
  }

  public saveSession(transcript: any[], project: string, annotator: string, jobno: number, data_id: number,
                     status: string, comment: string, quality: any, log: any[]): Promise<any> {
    if (
      project !== '' &&
      transcript.length > 0 &&
      quality !== null
    ) {
      const cmd_json = {
        querytype: 'continueannotation',
        transcript: JSON.stringify(transcript),
        project: project,
        annotator: annotator,
        comment: comment,
        jobno: jobno,
        status: status,
        quality: quality,
        id: data_id,
        log: log
      };

      return this.post(cmd_json);
    } else {
      throw new Error('saveSession - validation false');
    }
  }

  public closeSession(annotator: string, id: number, comment: string): Promise<any> {
    comment = (comment) ? comment : '';

    if (
      annotator !== null &&
      id !== null && id > -1) {
      const cmd_json = {
        querytype: 'endannotation',
        annotator: annotator,
        comment: comment,
        id: id
      };

      return this.post(cmd_json);
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

      return this.server_url + '?dir=' + dir + '&src=' + src;
    } else {
      throw new Error('getAudioBuffer - validation false');
    }
  }

  public getProjects() {
    const cmd_json = {
      querytype: 'listprojects'
    };

    return this.post(cmd_json);
  }

  public post(json: any): Promise<any> {
    const body = JSON.stringify(json);

    return new Promise<void>((resolve, reject) => {
      this.http.post(this.server_url, body, {
        responseType: 'json'
      }).subscribe((obj) => {
          resolve(<any> obj);
        },
        (err) => {
          reject(err);
        });
    });
  }

  public init(server_url: string) {
    const sanitized_url = this.sanitizer.sanitize(SecurityContext.URL, server_url);
    this.server_url = sanitized_url;
  }

  public sendBugReport(email: string = '', description: string = '', log: any): Promise<any> {
    const json = JSON.stringify(log);

    const cmd_json = {
      querytype: 'reportbug',
      email: email,
      buglogtext: json
    };

    return this.post(cmd_json);
  }

  public setOnlineSessionToFree: (appStorageService) => Promise<void> = (appStorage) => {
    // check if old annotation is already annotated
    return new Promise<void>((resolve, reject) => {
      this.fetchAnnotation(appStorage.data_id).then((json) => {
        if (!isNullOrUndefined(json) && !isNullOrUndefined(json.data)) {
          if (json.data.hasOwnProperty('status') && json.data.status === 'BUSY') {
            this.closeSession(appStorage.user.id, appStorage.data_id, '').then(() => {
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
    });
  }
}
