import { Injectable, Output, EventEmitter } from '@angular/core';
import 'rxjs/Rx';
import { Http } from "@angular/http";

import { SubscriptionManager } from "../shared";
import { AppConfigValidator } from "../validator/AppConfigValidator";
import { ConfigValidator } from "../shared/ConfigValidator";
import { ProjectConfiguration } from "../types/Settings/project-configuration";
import { Subscription } from "rxjs/Subscription";
import { TranscriptionService } from "./transcription.service";
import { SessionService } from "./session.service";
import { AudioService } from "./audio.service";
import { isNullOrUndefined } from "util";
import { Observable } from "rxjs/Observable";

@Injectable()
export class SettingsService {
	get log(): string {
		return this._log;
	}
	get filename(): string {
		return this._filename;
	}
	get guidelines(): any {
		return this._guidelines;
	}
	get tidyUpMethod(): (string, any) => string {
		return this._tidyUpMethod;
	}
	get validationmethod(): (string, any) => any[] {
		return this._validationmethod;
	}
	get projectsettings(): ProjectConfiguration {
		return this._projectsettings;
	}
	get loaded(): boolean {
		return this._loaded;
	}

	set loaded(value: boolean) {
		this._loaded = value;
	}
	get validated(): boolean {
		return this.validation.app;
	}

	get app_settings(): any {
		return this._app_settings;
	}

	get responsive(): {
		enabled:boolean,
		fixedwidth: number
	} {
		if(!isNullOrUndefined(this.projectsettings) && !isNullOrUndefined(this.projectsettings.responsive)){
			return this.projectsettings.responsive;

		}
		else{
			return this.app_settings.octra.responsive;
		}
	}

	public settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
	private app_settingsloaded: EventEmitter<boolean> = new EventEmitter<boolean>();
	public projectsettingsloaded: EventEmitter<any> = new EventEmitter<any>();
	public validationmethodloaded = new EventEmitter<void>();
	public audioloaded:EventEmitter<any> = new EventEmitter<any>();
	public guidelinesloaded = new EventEmitter<any>();

	private subscrmanager: SubscriptionManager;

	private _projectsettings:ProjectConfiguration;
	private _app_settings: any;
	private _guidelines: any;
	private _loaded:boolean = false;
	private _log:string = "";

	private _filename:string;

	private _validationmethod: (string, any) => any[] = null;
	private _tidyUpMethod: (string, any) => string = null;

	private validation: any = {
		app    : false
	};

	public get allloaded():boolean{
		return (
			!isNullOrUndefined(this.projectsettings)
		)
	}

	constructor(
		private http: Http,
		private sessService:SessionService
	) {
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
				console.log("application settings loaded");
				if (this.validation.app) {
					this.app_settingsloaded.emit(true);
				} else{
					console.error("config.json validation error.");
				}
			},
			(error)=>{
				console.log(error);
				this._log += "Loading application config failed<br/>";
			}
		));

		return result;
	}

	public loadProjectSettings(): Subscription {
		return this.http.request("./config/projectconfig.json").subscribe(
			(result) => {
				this._projectsettings = result.json();
				let validation = this.validate(new AppConfigValidator(), this._app_settings);
				console.log("project settings loaded");
				if (validation) {
					this.projectsettingsloaded.emit(this._projectsettings);
				} else{
					console.error("config.json validation error.");
				}
			},
			(error)=>{
				console.log(error);
				this._log += "Loading project config failed<br/>";
			}
		);
	}

	public loadGuidelines(language: string, url: string): Subscription {
		return this.http.get(url).subscribe(
			(response) => {
				let guidelines = response.json();
				this._guidelines = guidelines;
				console.log("guidelines settings loaded");
				this.loadValidationMethod(guidelines.meta.validation_url);
				this.guidelinesloaded.emit(guidelines);
			},
			(error)=>{
				this._log += "Loading guidelines failed<br/>";
			}
		);
	}

	public loadValidationMethod(url: string): Subscription {
		return this.http.get(url).subscribe(
			(response) => {
				let js = document.createElement("script");

				js.type = "text/javascript";
				js.src = url;
				js.id = "validationJS";

				document.body.appendChild(js);
				console.log("methods settings loaded");
				setTimeout(()=>{
					this._validationmethod = validateAnnotation;
					this._tidyUpMethod = tidyUpAnnotation;
				}, 2000);

				this.validationmethodloaded.emit();
			}
			,
			(error)=>{
				console.log(error);
				this._log += "Loading functions failed<br/>";
			}
		);
	}

	public loadAudioFile(audioService:AudioService) {
		if (audioService.audiocontext) {
			this.subscrmanager.add(
				audioService.afterloaded.subscribe((result)=>{
					console.log("audio settings loaded");
					this.audioloaded.emit(result);
				})
			);

			if (this.sessService.offline != true) {
				let src = this.app_settings.audio_server.url + this.sessService.audio_url;
				//extract filename
				this._filename = this.sessService.audio_url.substr(this.sessService.audio_url.lastIndexOf("/") + 1);
				this._filename = this._filename.substr(0, this._filename.lastIndexOf("."));

				audioService.loadAudio(src,()=>{}, (err)=>{
					let errMsg = err;
					this._log += "Loading audio file failed<br/>";
				});
			}
			else {
				//offline mode
				this._filename = this.sessService.file.name;
				this._filename = this._filename.substr(0, this._filename.lastIndexOf("."));

				//read file
				let reader = new FileReader();

				reader.onload = ((theFile) => {
					return function (e) {
						// Render thumbnail.
					};
				})(this.sessService.sessionfile);

				reader.onloadend = (ev) => {
					let t: any = ev.target;

					this.sessService.offline = true;

					audioService.decodeAudio(t.result);
				};

				if (this.sessService.file != null) {
					//file not loaded. Load again!
					reader.readAsArrayBuffer(this.sessService.file);
				}
			}
		} else{
			this.audioloaded.emit({
				result:"success"
			});
		}
	}

	private triggerSettingsLoaded = () => {
		if (this.validated) {
			this.loaded = true;
			this.settingsloaded.emit(true);
		}
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
