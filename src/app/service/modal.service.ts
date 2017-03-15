import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class ModalService {
	public showmodal: EventEmitter<{ type: string, text: string, functions: any }> = new EventEmitter<{ type: string, text: string, functions: any }>();

	constructor() {
	}

	/**
	 * shows a predefined modal. this modal must be defined in octra-modal.component.
	 * @param type
	 * @param text
	 * @param funcs
	 */
	public show(type: string, text: string = "", funcs: any = null) {
		this.showmodal.emit({ type: type, text: text, functions: funcs });
	}
}
