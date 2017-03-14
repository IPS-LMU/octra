import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class ModalService {
	public showmodal: EventEmitter<{ type: string, text: string }> = new EventEmitter<{ type: string, text: string }>();

	constructor() {
	}

	public newtranscriptionclick:EventEmitter<void> = new EventEmitter<void>();
	public stoptranscriptionclick:EventEmitter<void> = new EventEmitter<void>();

	public show(type: string, text: string = "") {
		this.showmodal.emit({ type: type, text: text });
	}
}
