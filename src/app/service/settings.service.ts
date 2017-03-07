import { Injectable, Output, EventEmitter } from '@angular/core';
import 'rxjs/Rx';
import { Http } from "@angular/http";

import { SubscriptionManager } from "../shared";
import { AppConfigValidator } from "../validator/AppConfigValidator";

@Injectable()
export class SettingsService {
	get validated(): boolean {
		return this._validated;
	}

	get app_settings(): any {
		return this._app_settings;
	}

	public settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();

	private subscrmanager: SubscriptionManager;
	private _app_settings: any;
	private _validated: boolean = false;

	constructor(private http: Http) {
		this.subscrmanager = new SubscriptionManager();
		this._app_settings = this.getApplicationSettings();
	}

	getApplicationSettings(): any {
		let result: any = null;

		this.subscrmanager.add(this.http.request("./config/config.json").subscribe(
			(result) => {
				this._app_settings = result.json();
				this.validate();
				if (this._validated) {
					this.settingsloaded.emit(this.validated);
				}
			},
			() => {
				console.error("config.json not found. Please create this file in a folder named 'config'");
			}
		));

		return result;
	}

	private validate() {
		//validate app config
		let validator: AppConfigValidator = new AppConfigValidator();

		for (let setting in this._app_settings) {
			let result = validator.validate(setting, this._app_settings[ "" + setting + "" ]);
			if (!result.success) {
				this._validated = false;
				console.error(result.error);
			}
			else {
				this._validated = true;
			}
		}
	}

	public destroy() {
		this.subscrmanager.destroy();
	}
}
