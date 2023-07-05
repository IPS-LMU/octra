import { HttpClient } from '@angular/common/http';
import { Injectable, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { API } from '../../obj/API/api.interface';
import { AppStorageService } from './appstorage.service';
import { hasProperty } from '@octra/utilities';

@Injectable()
export class APIService implements API {
  private serverURL = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  public beginSession(
    project: string,
    annotator: string,
    jobno: number,
    password?: string
  ): Promise<any> {
    // validation
    if (project !== '' && annotator !== '') {
      const cmdJSON = {
        querytype: 'startannotation',
        annotator,
        project,
        jobno,
      };

      return this.post(cmdJSON);
    }
    throw new Error('beginSession - validation false');
  }

  public continueSession(
    project: string,
    annotator: string,
    jobno: number
  ): Promise<any> {
    if (
      project !== undefined &&
      project !== '' &&
      annotator !== undefined &&
      annotator !== ''
    ) {
      const cmdJSON = {
        querytype: 'continueannotation',
        project,
        annotator,
        jobno,
      };
      return this.post(cmdJSON);
    } else {
      throw new Error('continueSession - validation false');
    }
  }

  public fetchAnnotation(id: number): Promise<any> {
    const cmdJSON = {
      querytype: 'fetchannotation',
      id,
    };
    return this.post(cmdJSON);
  }

  public lockSession(
    transcript: any[],
    project: string,
    annotator: string,
    jobno: number,
    dataID: number,
    comment: string,
    quality: any,
    log: any[]
  ): Promise<any> {
    if (project !== '' && transcript.length > 0 && quality !== undefined) {
      const cmdJSON = {
        querytype: 'continueannotation',
        transcript: JSON.stringify(transcript),
        project,
        annotator,
        comment,
        jobno,
        status: 'BUSY',
        quality: JSON.stringify(quality),
        id: dataID,
        log,
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('saveSession - validation false');
    }
  }

  /**
   * this method doesn't work! Do not use it.
   */
  public unlockSession(project: string, dataID: number): Promise<any> {
    if (project !== '') {
      const cmdJSON = {
        querytype: 'continueannotation',
        transcript: '',
        project,
        annotator: '',
        comment: '',
        status: 'FREE',
        quality: '',
        id: dataID,
        log: [],
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('unlockSession - validation false');
    }
  }

  public saveSession(
    transcript: any[],
    project: string,
    annotator: string,
    jobno: number,
    dataID: number,
    status: string,
    comment: string,
    quality: any,
    log: any[]
  ): Promise<any> {
    if (project !== '' && transcript.length > 0 && quality !== undefined) {
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
        log,
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('saveSession - validation false');
    }
  }

  public closeSession(
    annotator: string,
    id: number,
    comment: string
  ): Promise<any> {
    comment = comment ? comment : '';

    if (annotator !== undefined && id !== undefined && id > -1) {
      const cmdJSON = {
        querytype: 'endannotation',
        annotator,
        comment,
        id,
      };

      return this.post(cmdJSON);
    } else {
      throw new Error('closeSession - validation false');
    }
  }

  public getAudioURL(dir: string, src: string): string {
    if (dir !== undefined && dir !== '' && src !== undefined && src !== '') {
      dir = this.sanitizer.sanitize(SecurityContext.URL, dir);
      src = this.sanitizer.sanitize(SecurityContext.URL, src);

      return this.serverURL + '?dir=' + dir + '&src=' + src;
    } else {
      throw new Error('getAudioBuffer - validation false');
    }
  }

  public getProjects(): Promise<any> {
    const cmdJSON = {
      querytype: 'listprojects',
    };

    return new Promise<any>((resolve, reject) => {
      let checked = false;

      setTimeout(() => {
        checked = true;
        reject(new Error('API timeout: server does not answer.'));
      }, 2000);

      this.post(cmdJSON)
        .then((result) => {
          if (!checked) {
            resolve(result);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  public post(json: any): Promise<any> {
    const body = JSON.stringify(json);

    return new Promise<void>((resolve, reject) => {
      this.http
        .post(this.serverURL, body, {
          responseType: 'json',
        })
        .subscribe(
          (obj) => {
            resolve(obj as any);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }

  public init(serverURL: string) {
    this.serverURL = this.sanitizer.sanitize(SecurityContext.URL, serverURL);
  }

  public sendBugReport(
    email: string = '',
    description: string = '',
    log: any
  ): Promise<any> {
    const json = JSON.stringify(log);

    const cmdJSON = {
      querytype: 'reportbug',
      email,
      buglogtext: json,
    };

    return this.post(cmdJSON);
  }

  public setOnlineSessionToFree = (appStorage: AppStorageService) => {
    // check if old annotation is already annotated
    return new Promise<void>((resolve, reject) => {
      if (
        appStorage.transcriptID !== undefined &&
        appStorage.transcriptID > -1
      ) {
        this.fetchAnnotation(appStorage.transcriptID)
          .then((json) => {
            if (json !== undefined && json.data !== undefined) {
              if (
                hasProperty(json.data, 'status') &&
                json.data.status === 'BUSY'
              ) {
                this.closeSession(
                  appStorage.snapshot.authentication.me.username,
                  appStorage.transcriptID,
                  ''
                )
                  .then(() => {
                    resolve();
                  })
                  .catch((error) => {
                    reject(error);
                  });
              } else {
                resolve();
              }
            } else {
              // json data is undefined or undefined, ignore
              resolve();
            }
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        resolve();
      }
    });
  };
}
