import { Component, OnInit, Output, Input, EventEmitter, OnDestroy } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { SubscriptionManager } from "../../shared/SubscriptionManager";
import { SettingsService } from "../../service/settings.service";
import { SessionService } from "../../service/session.service";
import { isNullOrUndefined } from "util";
import { AudioService } from "../../service/audio.service";
import { Router } from "@angular/router";

@Component({
	selector   : 'app-loading',
	templateUrl: './loading.component.html',
	styleUrls  : [ './loading.component.css' ]
})
export class LoadingComponent implements OnInit, OnDestroy {
	@Output('loaded') loaded: boolean;
	public text: string = "";

	subscrmanager: SubscriptionManager = new SubscriptionManager();

	private loadedchanged: EventEmitter<boolean> = new EventEmitter<boolean>();

	private loadedtable: any = {
		projectconfig: false,
		guidelines   : false,
		methods      : false,
		audio        : false
	};

	public progress: number = 0;

	constructor(private langService: TranslateService,
				private settService: SettingsService,
				private sessionService: SessionService,
				public audio: AudioService,
				private router: Router) {
		langService.get("general.please wait").subscribe(
			(translation) => {
				this.text = translation + "...";
			}
		);
	}

	ngOnInit() {
		this.subscrmanager.add(
			this.settService.projectsettingsloaded.subscribe(
				(projectsettings) => {
					this.loadedtable.projectconfig = true;
					this.progress += 25;
					if (isNullOrUndefined(this.settService.guidelines)) {
						let language = this.langService.currentLang;
						if (isNullOrUndefined(projectsettings.languages.find((x) => {
								return x === language
							}))) {
							//fall back to first defined language
							language = projectsettings.languages[ 0 ];
						}
						this.subscrmanager.add(
							this.settService.loadGuidelines(this.sessionService.language, "./guidelines/guidelines_" + language + ".json")
						);
					}
					else {
						this.loadedtable.guidelines = true;
					}
					this.loadedchanged.emit(false);
				}
			)
		);

		this.subscrmanager.add(
			this.settService.guidelinesloaded.subscribe(
				(guidelines) => {
					this.loadedtable.guidelines = true;
					this.progress += 25;
					this.loadedchanged.emit(false);
				}
			)
		);

		this.subscrmanager.add(
			this.settService.validationmethodloaded.subscribe(
				() => {
					this.loadedtable.methods = true;
					this.progress += 25;
					this.loadedchanged.emit(false);
				}
			)
		);

		this.subscrmanager.add(
			this.settService.audioloaded.subscribe(
				(result) => {
					if (result.status === "success") {
						this.loadedtable.audio = true;
						this.progress += 25;
						console.log(this.audio.audiobuffer.length)
						this.loadedchanged.emit(false);
					}
					else {
						alert("ERROR: " + result.error);
					}
				}
			)
		);

		let id = this.subscrmanager.add(
			this.loadedchanged.subscribe(
				() => {
					if (
						this.loadedtable.guidelines
						&& this.loadedtable.projectconfig
						&& this.loadedtable.methods
						&& this.loadedtable.audio
					) {
						console.log("All loaded!");
						this.subscrmanager.remove(id);
						console.log("LEAVE");
						setTimeout(() => {
							this.router.navigate([ "/user/transcr" ])
						}, 500);
					}
				}
			)
		);

		if (isNullOrUndefined(this.settService.projectsettings)) {
			this.subscrmanager.add(
				this.settService.loadProjectSettings()
			);
		}
		else {
			this.loadedtable.projectconfig = true;
		}

		if (!isNullOrUndefined(this.settService.guidelines) && ((this.settService.tidyUpMethod) || isNullOrUndefined(this.settService.validationmethod))) {
			this.subscrmanager.add(
				this.settService.loadValidationMethod(this.settService.guidelines.meta.validation_url)
			);
		}
		else {
			this.loadedtable.methods = true;
		}

		this.settService.loadAudioFile(this.audio);
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}

}
