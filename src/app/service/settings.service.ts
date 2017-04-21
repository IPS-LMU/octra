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
import { Logger } from "../shared/Logger";
import { ProjectConfigValidator } from "../validator/ProjectConfigValidator";

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
		Logger.log("Load Application Settings...");
		this.subscrmanager.add(this.http.request("./config/appconfig.json").subscribe(
			(result) => {
				this._app_settings = result.json();
				Logger.log("AppSettings loaded.");
				this.validation.app = this.validate(new AppConfigValidator(), this._app_settings);
				if (this.validation.app) {
					this.app_settingsloaded.emit(true);
				} else{
					Logger.err("appconfig.json validation error.");
				}
			},
			(error)=>{
				this._log += "Loading application config failed<br/>";
			}
		));

		return result;
	}

	public loadProjectSettings:()=>Subscription = () => {
		Logger.log("Load Project Settings...");
		return this.http.request("./config/projectconfig.json").subscribe(
			(result) => {
				this._projectsettings = result.json();
				Logger.log("Projectconfig loaded.");
				let validation = this.validate(new ProjectConfigValidator(), this._app_settings);
				if (validation) {
					this.projectsettingsloaded.emit(this._projectsettings);
				} else{
					Logger.err("projectconfig.json validation error.");
				}
			},
			(error)=>{
				this._log += "Loading project config failed<br/>";
			}
		);
	};

	public loadGuidelines:((language: string, url: string)=>Subscription) = (language: string, url: string) => {
		Logger.log("Load Guidelines ("+ language +")...");
		return this.http.get(url).subscribe(
			(response) => {
				let guidelines = response.json();
				Logger.log("Guidelines loaded.");
				this._guidelines = guidelines;
				this.loadValidationMethod(guidelines.meta.validation_url);
				this.guidelinesloaded.emit(guidelines);
			},
			(error)=>{
				this._log += "Loading guidelines failed<br/>";
			}
		);
	};

	public loadValidationMethod:((url: string)=>Subscription) = (url: string) => {
		Logger.log("Load Methods...");
		return this.http.get(url).subscribe(
			(response) => {
				let js = document.createElement("script");

				js.type = "text/javascript";
				js.src = url;
				js.id = "validationJS";

				document.body.appendChild(js);
				Logger.log("Methods loaded.");
				setTimeout(()=>{
					this._validationmethod = validateAnnotation;
					this._tidyUpMethod = tidyUpAnnotation;
					this.validationmethodloaded.emit();
				}, 2000);
			}
			,
			(error)=>{
				this._log += "Loading functions failed<br/>";
			}
		);
	};

	public loadAudioFile:((audioService: AudioService) => void) = (audioService:AudioService)=> {
		Logger.log("Load audio...");
		if (isNullOrUndefined(audioService.audiobuffer)) {
			this.subscrmanager.add(
				audioService.afterloaded.subscribe((result)=>{
					Logger.log("Audio loaded.");
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
				this._filename = this.sessService.sessionfile.name;
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
	};

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

	public clearSettings(){
		this._guidelines = null;
		this._projectsettings = null;
		this._validationmethod = null;
		this._tidyUpMethod = null;
	}
}
