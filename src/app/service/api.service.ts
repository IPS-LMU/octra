import {Injectable, SecurityContext} from '@angular/core';
import {API} from '../interface/api.interface';
import {Headers, Http, Response} from '@angular/http';
import 'rxjs/Rx';
import {DomSanitizer} from '@angular/platform-browser';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class APIService implements API {
  private server_url = '';

  constructor(private http: Http,
              private sanitizer: DomSanitizer) {
  }

  public beginSession(project: string, annotator: string, jobno: number, password?: string): Observable<Response> {
    // validation
    if (project !== '' && (annotator !== '')) {

      const cmd_json = {
        querytype: 'startannotation',
        project: project,
        jobno: jobno
      };

      return this.post(cmd_json);
    }
    throw new Error('beginSession - validation false');
  }

  public continueSession(project: string, annotator: string, jobno: number): Observable<Response> {
    if (project != null && project !== '' &&
      annotator != null && annotator !== ''
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

  public fetchAnnotation(id: number): Observable<Response> {
    const cmd_json = {
      querytype: 'fetchannotation',
      id: id
    };
    return this.post(cmd_json);
  }

  public lockSession(transcript: any[], project: string, annotator: string, jobno: number,
                     data_id: number, comment: string, quality: any, log: any[]): Observable<Response> {
    if (
      project !== '' &&
      transcript.length > 0 &&
      quality != null
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
   * @returns {Observable<Response>}
   */
  public unlockSession(project: string,
                       data_id: number): Observable<Response> {
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
                     status: string, comment: string, quality: any, log: any[]): Observable<Response> {
    if (
      project !== '' &&
      transcript.length > 0 &&
      quality != null
    ) {
      const cmd_json = {
        querytype: 'continueannotation',
        transcript: JSON.stringify(transcript),
        project: project,
        annotator: annotator,
        comment: comment,
        jobno: jobno,
        status: status,
        quality: JSON.stringify(quality),
        id: data_id,
        log: log
      };

      return this.post(cmd_json);
    } else {
      throw new Error('saveSession - validation false');
    }
  }

  public closeSession(annotator: string, id: number, comment: string): Observable<Response> {
    comment = (comment) ? comment : '';

    if (
      annotator != null && annotator !== '' &&
      id != null && id > -1) {
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
      dir != null && dir !== '' &&
      src != null && src !== ''
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

  public post(json: any): Observable<Response> {
    const body = JSON.stringify(json);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return this.http.post(this.server_url, body, headers);
  }

  public init(server_url: string) {
    const sanitized_url = this.sanitizer.sanitize(SecurityContext.URL, server_url);
    this.server_url = sanitized_url;
  }
}
