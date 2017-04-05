import { Injectable, Output, EventEmitter } from '@angular/core';
import 'rxjs/Rx';
import { Http } from "@angular/http";

import { SubscriptionManager } from "../shared";
import { AppConfigValidator } from "../validator/AppConfigValidator";
import { ConfigValidator } from "../shared/ConfigValidator";

@Injectable()
export class SettingsService {
	get validated(): boolean {
		return this.validation.app;
	}

	get app_settings(): any {
		return this._app_settings;
	}

	public settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
	private app_settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
	private subscrmanager: SubscriptionManager;
	private _app_settings: any;
	private validation: any = {
		app    : false
	};

	constructor(private http: Http) {
		this.subscrmanager = new SubscriptionManager();
		this.subscrmanager.add(
			this.app_settingsloaded.subscribe(this.triggerSettingsLoaded)
		);
		this._app_settings = this.getApplicationSettings();
	}

	getApplicationSettings(): any {
		let result: any = null;

		this.subscrmanager.add(this.http.request("./config/config.json").subscribe(
			(result) => {
				this._app_settings = result.json();
				this.validation.app = this.validate(new AppConfigValidator(), this._app_settings);
				if (this.validation.app) {
					this.app_settingsloaded.emit(true);
				} else{
					console.error("config.json validation error.");
				}
			},
			() => {
				console.error("config.json not found. Please create this file in a folder named 'config'");
			}
		));

		return result;
	}

	private triggerSettingsLoaded = () => {
		if (this.validated)
			this.settingsloaded.emit(true);
	};

	private validate(validator: ConfigValidator, settings:any): boolean {
		//validate app config

		for (let setting in settings) {
			let result = validator.validate(setting, settings[ "" + setting + "" ]);
			if (!result.success) {
				console.error(result.error);
				return false;
			}
		}
		return true;
	}

	public destroy() {
		this.subscrmanager.destroy();
	}
}
