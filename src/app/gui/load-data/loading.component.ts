import { Component, OnInit, Output, Input } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector   : 'app-loading',
	templateUrl: './loading.component.html',
	styleUrls  : [ './loading.component.css' ]
})
export class LoadingComponent implements OnInit {
	@Output('loaded') loaded:boolean;
	public text:string = "";

	constructor(private langService:TranslateService) {
		this.text = langService.instant("general.please wait")+ "...";
	}

	ngOnInit() {

	}

}
