import { Injectable } from '@angular/core';

@Injectable()
export class DialogService {
	private showoverlay:boolean = false;
	private type:string = "";

	constructor(){

	}

	public open(type:string){
		this.showoverlay = true;
	}

	public close(type:string){
		this.showoverlay = false;
	}
}
