import { Injectable, SecurityContext } from '@angular/core';
import { API } from "../interface/api.interface";
import { Http, Response, Headers } from "@angular/http";
import 'rxjs/Rx';
import { DomSanitizer } from "@angular/platform-browser";
import { Observable } from "rxjs";

@Injectable()
export class APIService implements API {
	private server_url: string = "";

	constructor(private http: Http,
				private sanitizer: DomSanitizer) {
	}

	public beginSession(project: string, annotator: string, jobno: number, password?: string): Observable<Response> {
		//validation
		if (project != "" && (annotator != "")) {

			let cmd_json = {
				querytype: "startannotation",
				project  : project,
				jobno    : jobno
			};

			return this.post(cmd_json);
		}
		throw "beginSession - validation false";
	}

	public continueSession(project: string, annotator: string, jobno: number): Observable<Response> {
		if (project != null && project != "" &&
			annotator != null && annotator != ""
		) {
			let cmd_json = {
				querytype: "continueannotation",
				project  : project,
				annotator: annotator,
				jobno    : jobno
			};
			return this.post(cmd_json);
		}
		else {
			throw "continueSession - validation false";
		}
	}

	public fetchAnnotation(id: number): Observable<Response> {
		let cmd_json = {
			querytype: "fetchannotation",
			id       : id
		};
		return this.post(cmd_json);
	}

	public lockSession(transcript: any[], project: string, annotator: string, jobno: number, data_id: number, comment: string, quality: any, log: any[]): Observable<Response> {
		if (
			project != "" &&
			transcript.length > 0 &&
			quality != null
		) {
			let cmd_json = {
				querytype : "continueannotation",
				transcript: JSON.stringify(transcript),
				project   : "transcription",
				annotator : annotator,
				comment   : comment,
				jobno     : jobno,
				status    : "BUSY",
				quality   : JSON.stringify(quality),
				id        : data_id,
				log       : log
			};

			return this.post(cmd_json);
		}
		else {
			throw "saveSession - validation false";
		}
	}

	public saveSession(transcript: any[], project: string, annotator: string, jobno: number, data_id: number, status: string, comment: string, quality: any, log: any[]): Observable<Response> {
		if (
			project != "" &&
			transcript.length > 0 &&
			quality != null
		) {
			console.log(data_id);
			let cmd_json = {
				querytype : "continueannotation",
				transcript: JSON.stringify(transcript),
				project   : "transcription",
				annotator : annotator,
				comment   : comment,
				jobno     : jobno,
				status    : status,
				quality   : JSON.stringify(quality),
				id        : data_id,
				log       : log
			};

			return this.post(cmd_json);
		}
		else {
			throw "saveSession - validation false";
		}
	}

	public closeSession(annotator: string, id: number, comment: string): Observable<Response> {
		comment = (comment) ? comment : "";

		if (
			annotator != null && annotator != "" &&
			id != null && id > -1) {
			let cmd_json = {
				querytype: "endannotation",
				annotator: annotator,
				comment  : comment,
				id       : id, //notwendig?
			};

			return this.post(cmd_json);
		}
		else {
			throw "closeSession - validation false";
		}
	}

	public getAudioURL(dir: string, src: string): string {
		if (
			dir != null && dir != "" &&
			src != null && src != ""
		) {
			dir = this.sanitizer.sanitize(SecurityContext.URL, dir);
			src = this.sanitizer.sanitize(SecurityContext.URL, src);

			return this.server_url + "?dir=" + dir + "&src=" + src;
		}
		else {
			throw "getAudioBuffer - validation false";
		}
	}

	public getProjects() {
		let cmd_json = {
			querytype: "listprojects"
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
		let sanitized_url = this.sanitizer.sanitize(SecurityContext.URL, server_url);
		this.server_url = sanitized_url;
	}
}
