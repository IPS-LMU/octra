import { Injectable } from '@angular/core';
import { Observable } from "rxjs";

declare var window: any;
declare var navigator: any;
declare var FileError: any;

@Injectable()

export class FileService {

	constructor() {
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
	}

	openFileSystem(quota: number, callback: (fs: any) => void) {
		navigator.webkitPersistentStorage.requestQuota(quota, () => {
			window.requestFileSystem(window.PERSISTENT, quota, callback, this.errorHandler);
		}, (e) => {
			console.error("Error: " + e)
		});
	}

	public errorHandler(e) {
		let msg = '';

		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				msg = 'QUOTA_EXCEEDED_ERR';
				break;
			case FileError.NOT_FOUND_ERR:
				msg = 'NOT_FOUND_ERR';
				break;
			case FileError.SECURITY_ERR:
				msg = 'SECURITY_ERR';
				break;
			case FileError.INVALID_MODIFICATION_ERR:
				msg = 'INVALID_MODIFICATION_ERR';
				break;
			case FileError.INVALID_STATE_ERR:
				msg = 'INVALID_STATE_ERR';
				break;
			default:
				msg = 'Unknown Error';
				break;
		}
		;

		console.error('File API - Error: ' + msg);
	}
}
