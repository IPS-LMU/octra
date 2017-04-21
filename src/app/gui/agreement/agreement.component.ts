import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { isNullOrUndefined } from "util";
import { SettingsService } from "../../service/settings.service";
import { Router } from "@angular/router";
import { LangChangeEvent, TranslateService } from "@ngx-translate/core";
import { SessionService } from "../../service/session.service";
import { SubscriptionManager } from "../../shared/SubscriptionManager";

@Component({
	selector   : 'app-agreement',
	templateUrl: './agreement.component.html',
	styleUrls  : [ './agreement.component.css' ]
})
export class AgreementComponent implements OnInit {

	private subscrmanager:SubscriptionManager = new SubscriptionManager();

	constructor(public settService: SettingsService,
				private router: Router,
				private langService:TranslateService,
				private sessService:SessionService
	) {
		if (isNullOrUndefined(this.settService.projectsettings)) {
			this.router.navigate([ "/user/load" ]);
		}
	}

	ngOnInit() {
	}

	public toHTML(text: any): string {
		if (!isNullOrUndefined(text)){
			if(!isNullOrUndefined(text[this.langService.currentLang])){
				return text[this.langService.currentLang].replace("\n", "<br/>");
			}else{
				for(let l in text){
					return text[l].replace("\n", "<br/>");
				}
			}
		}
		else
			return "";
	}

	logout(){
		this.settService.clearSettings();
		this.router.navigate([ '/logout' ]);
	}

	accept(){
		if(isNullOrUndefined(this.sessService.agreement)){
			this.sessService.agreement = {};
		}
		this.sessService.agreement[this.sessService.member_project] = true;
		this.sessService.sessStr.store("agreement", this.sessService.agreement);
		this.router.navigate(["/user/transcr"]);
	}
}
