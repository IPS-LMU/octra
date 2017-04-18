import { Observable } from "rxjs";
import { Response } from "@angular/http";
/***
 * API Interface which have to be implemented by an API Service
 */
export interface API{
	beginSession(project: string, annotator: string, jobno:number, errorhandler:any, password?: string): Observable<Response>;
	continueSession(project: string, annotator: string, jobno:number, errorhandler:any): Observable<Response>;
	fetchAnnotation(id:number): Observable<Response>;
	saveSession(transcript: any[], project: string, annotator: string, jobno:number, data_id:number, status:string, comment: string, quality: any, log: any[]):Observable<Response>;
	closeSession(annotator: string, id: number, comment: string): Observable<Response>;
	getAudioURL(dir: string, src: string): string;

	post(json:any, errorhandler:any):Observable<Response>;
}