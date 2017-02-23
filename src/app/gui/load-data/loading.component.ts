import { Component, OnInit, Output, Input } from '@angular/core';

@Component({
	selector   : 'app-loading',
	templateUrl: 'loading.component.html',
	styleUrls  : [ 'loading.component.css' ]
})
export class LoadingComponent implements OnInit {
	@Output('loaded') loaded:boolean;
	public text:string = "Bitte warten... Datei wird geladen";

	constructor() {
	}

	ngOnInit() {

	}

}
