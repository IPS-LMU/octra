import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	AfterContentInit,
	ViewChild,
	HostListener,
	OnChanges,
	ChangeDetectorRef,
	ChangeDetectionStrategy
} from '@angular/core';
import { Router } from "@angular/router";
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';

import {
	AudioService,
	UserInteractionsService,
	TranscriptionService,
	SessionService,
	KeymappingService,
	NavbarService,
	SettingsService,
	MessageService,
	ModalService
} from "../../service";

import { BrowserInfo, StatisticElem, SubscriptionManager } from "../../shared";
import { isNullOrUndefined } from "util";
import { TranslateService, LangChangeEvent } from "@ngx-translate/core";
import { TranscrGuidelinesComponent } from "../transcr-guidelines/transcr-guidelines.component";

@Component({
	selector       : 'app-transcription',
	templateUrl    : './transcription.component.html',
	styleUrls      : [ './transcription.component.css' ],
	providers      : [ MessageService ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptionComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, OnChanges {
	private subscrmanager: SubscriptionManager;

	@ViewChild('modal_shortcuts') modal_shortcuts: ModalComponent;
	@ViewChild('modal_guidelines') modal_guidelines: TranscrGuidelinesComponent;
	@ViewChild('modal_overview') overview: ModalComponent;

	private initialized: any = {};
	private viewinitialized = false;
	public showdetails:boolean = false;
	private saving = "";

	get help_url(): string {
		if (this.sessService.Interface === "audioplayer") {
			return "http://www.phonetik.uni-muenchen.de/apps/octra/videos/63sd324g43qt7-interface1/"
		}
		else if (this.sessService.Interface === "signaldisplay") {
			return "http://www.phonetik.uni-muenchen.de/apps/octra/videos/6at766dsf8ui34-interface2/";
		}
		else if (this.sessService.Interface === "overlay") {
			return "http://www.phonetik.uni-muenchen.de/apps/octra/videos/6at766dsf8ui34-interface3/";
		}

		return "";
	}

	get loaded(): boolean {
		return (this.audio.loaded && !isNullOrUndefined(this.transcrService.guidelines));
	}

	get appc(): any {
		return this.settingsService.app_settings;
	}

	get responsive(): boolean {
		return this.appc.octra.responsive.enabled;
	}

	user: number;

	private platform = BrowserInfo.platform;

	constructor(public router: Router,
				public audio: AudioService,
				public uiService: UserInteractionsService,
				public transcrService: TranscriptionService,
				public sessService: SessionService,
				public keyMap: KeymappingService,
				public changeDetecorRef: ChangeDetectorRef,
				public navbarServ: NavbarService,
				public settingsService: SettingsService,
				public modService: ModalService,
				public langService: TranslateService) {
		this.subscrmanager = new SubscriptionManager();
	}

	get dat(): string {
		return JSON.stringify(this.transcrService.exportDataToJSON(), null, 3);
	}

	get UIElements(): StatisticElem[] {
		return this.uiService.elements;
	}

	private get app_settings() {
		return this.settingsService.app_settings;
	}

	ngOnChanges() {
	}

	ngOnInit() {
		setInterval(() => {
			this.changeDetecorRef.markForCheck();
		}, 2000);

		this.subscrmanager.add(this.sessService.saving.subscribe(
			(saving) => {
				if (saving) {
					this.saving = "Saving...";
				}
				else {
					setTimeout(() => {
						this.saving = "";
					}, 1000);
				}
			}
		));

		if (this.audio.audiobuffer == null) {
			this.subscrmanager.add(this.audio.afterloaded.subscribe(this.afterAudioLoaded));

			if (this.app_settings.octra.logging_enabled == true) {
				this.subscrmanager.add(
					this.uiService.afteradd.subscribe((elem) => {
						this.sessService.save("logs", this.uiService.elementsToAnyArray());
					}));
			}
			this.transcrService.loadAudioFile();
			this.initialized[ "audiolayer" ] = false;
		}
		else {
			this.afterAudioLoaded();
		}

		if (!isNullOrUndefined(this.transcrService.segments)) {
			this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(this.transcrService.saveSegments));
		}
		else {
			this.subscrmanager.add(this.transcrService.dataloaded.subscribe(() => {
				this.subscrmanager.add(this.transcrService.segments.onsegmentchange.subscribe(this.transcrService.saveSegments));
			}));
		}
	}

	afterAudioLoaded = () => {
		this.sessService.SampleRate = this.audio.samplerate;
		this.change();
		this.navbarServ.show_hidden = true;

		//load guidelines
		this.subscrmanager.add(
			this.transcrService.loadGuidelines(this.sessService.language, "./guidelines/guidelines_" + this.langService.currentLang + ".json")
		);

		//load guidelines on language change
		this.subscrmanager.add(this.langService.onLangChange.subscribe(
			(event: LangChangeEvent) => {
				this.subscrmanager.add(
					this.transcrService.loadGuidelines(event.lang, "./guidelines/guidelines_" + event.lang + ".json")
				);
			}
		));

	};

	ngAfterViewInit() {
		this.viewinitialized = true;
		this.sessService.TranscriptionTime.start = Date.now();
		this.change();
		jQuery.material.init();
	}

	abortTranscription = () => {
		this.router.navigate([ '/logout' ]);
	};

	ngAfterContentInit() {
	}

	submitTranscription() {
		this.sessService.TranscriptionTime.end = Date.now();
		this.router.navigate([ '/user/transcr/submit' ]);
	}

	ngOnDestroy() {
		this.transcrService.destroy();
		this.subscrmanager.destroy();
	}

	change() {
		this.changeDetecorRef.markForCheck();
	}

	@HostListener("window:keydown", [ "$event" ])
	onKeyUp($event) {
		if ($event.altKey && $event.which == 56) {
			if (!this.modal_shortcuts.visible) {
				this.modal_shortcuts.open();
			}
			else this.modal_shortcuts.dismiss();
			$event.preventDefault();
		}
		else if ($event.altKey && $event.which == 57) {
			if (!this.modal_guidelines.visible)
				this.modal_guidelines.open();
			else this.modal_guidelines.close();
			$event.preventDefault();
		}
		if ($event.altKey && $event.which == 48) {
			if (!this.overview.visible) {
				this.transcrService.analyse();
				this.overview.open();
			}
			else this.overview.dismiss();
			$event.preventDefault();
		}
	}

	getText() {
		return this.transcrService.getTranscriptString("text");
	}

	clearElements(){
		this.uiService.clear();
		this.sessService.save("logs", this.uiService.elementsToAnyArray());
	}
}
