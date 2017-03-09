import { Component, OnDestroy } from '@angular/core';
import { APIService } from "./service/api.service";
import { AppConfigValidator } from "./validator/AppConfigValidator";
import { TranslateService } from "@ngx-translate/core";
import { SessionService } from "./service/session.service";
import { SettingsService } from "./service/settings.service";
import { SubscriptionManager } from "./shared/SubscriptionManager";
import { isNullOrUndefined } from "util";
import { isUndefined } from "util";

@Component({
	selector   : 'octra',
	templateUrl: 'app.component.html',
	styleUrls  : [ 'app.component.css' ]
})

export class AppComponent implements OnDestroy {
	version: string = "1.0.5";

	private subscrmanager: SubscriptionManager;

	constructor(private api: APIService,
				private langService: TranslateService,
				private sessService: SessionService,
				private settingsService: SettingsService) {
		this.subscrmanager = new SubscriptionManager();

		//define languages
		langService.addLangs([ 'de', 'en' ]);
		let browser_lang = langService.getBrowserLang();

		//check if browser language is available in translations
		if (isNullOrUndefined(sessService.language) || sessService.language == "") {
			if (!isUndefined(langService.getLangs().find((value, index, obj) => {
					return value == browser_lang
				}))) {
				langService.use(browser_lang);
			} else{
				langService.use("en");
			}
		}
		else {
			langService.use(sessService.language);
		}

		//load settings
		this.subscrmanager.add(this.settingsService.settingsloaded.subscribe(
			() => {
				//settings have been loaded
				if (isNullOrUndefined(this.settingsService.app_settings)) {
					throw "config.json not set correctly";
				}
				else {
					if (this.settingsService.validated) {
						this.api.init(this.settingsService.app_settings.audio_server.url + "WebTranscribe");
					}


					if (!this.settingsService.app_settings.octra.responsive.enabled) {
						//set fixed width
						let head = document.head || document.getElementsByTagName('head')[ 0 ];
						let style = document.createElement('style');
						style.type = 'text/css';
						style.innerText = ".container {width:" + this.settingsService.app_settings.octra.responsive.fixedwidth + "px}";
						head.appendChild(style);
					}
				}
			}
		));

		if (this.settingsService.validated) {
			this.api.init(this.settingsService.app_settings.audio_server.url + "WebTranscribe");

			if (!this.settingsService.app_settings.octra.responsive.enabled) {
				//set fixed width
				let head = document.head || document.getElementsByTagName('head')[ 0 ];
				let style = document.createElement('style');
				style.type = 'text/css';
				style.innerText = ".container {width:" + this.settingsService.app_settings.octra.responsive.fixedwidth + "px}";
				head.appendChild(style);
			}
		}
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}
}
