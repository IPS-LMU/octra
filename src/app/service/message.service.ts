import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class MessageService {
	constructor() {
	}

	public showmessage: EventEmitter<any> = new EventEmitter<any>();

	public showMessage(type: string, message: string) {
			this.showmessage.emit({
				type   : type,
				message: message
			});
	}
}
