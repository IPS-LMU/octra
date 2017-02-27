import { Component } from '@angular/core';
import { APP_CONFIG } from "./app.config";
import { APIService } from "./service/api.service";
import { AppConfigValidator } from "./validator/AppConfigValidator";
import { TranslateService } from "@ngx-translate/core";
import { SessionService } from "./service/session.service";

@Component({
	selector   : 'octra',
	templateUrl: 'app.component.html',
	styleUrls  : [ 'app.component.css' ]
})

export class AppComponent {
	version: string = "1.0.3";

	constructor(private api: APIService,
				private langService: TranslateService,
				private sessService: SessionService) {

		//define languages
		langService.addLangs(['de', 'en']);

		if(sessService.language == null || sessService.language == "")
			langService.setDefaultLang(langService.getBrowserLang());
		else
			langService.setDefaultLang(sessService.language);

		if (!APP_CONFIG.Settings) {
			throw "app-config not set correctly";
		}
		else {
			//validate app config
			let validator: AppConfigValidator = new AppConfigValidator();
			let validation_ok = true;

			for (let setting in APP_CONFIG.Settings) {
				let result = validator.validate(setting, APP_CONFIG.Settings[ "" + setting + "" ]);
				if (!result.success) {
					validation_ok = false;
					console.error(result.error);
				}
			}

			if (validation_ok)
				this.api.init(APP_CONFIG.Settings.AUDIO_SERVER + "WebTranscribe");
		}

	}
}
