import { Injectable, EventEmitter, Component } from '@angular/core';

@Injectable()
export class NavbarService {
	get show_hidden(): boolean {
		return this._show_hidden;
	}

	set show_hidden(value: boolean) {
		this._show_hidden = value;
	}

	public onexportbuttonclick = new EventEmitter<any>();

	private _show_hidden:boolean = false;

	public exportformats :any = {
		text: "",
		annotJSON: ""
	};

	constructor() {
	}

	onExportButtonClick(format:string){
		this.onexportbuttonclick.emit({
			format: format
		});
	}
}
