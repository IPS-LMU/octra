import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	AfterContentInit,
	ViewContainerRef,
	QueryList,
	ViewChildren,
	Output,
	ViewChild,
	EventEmitter,
	HostListener,
	OnChanges,
	ChangeDetectorRef,
	ChangeDetectionStrategy
} from '@angular/core';
import { Router} from "@angular/router";
import { AudioService } from "../../service/audio.service";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { TranscriptionService } from "../../service/transcription.service";

import { SessionService } from "../../service/session.service";
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { KeymappingService } from "../../service/keymapping.service";
import { AudioplayerGUIComponent } from "../audioplayer-gui/audioplayer-gui.component";
import { BrowserInfo } from "../../shared/BrowserInfo";
import { StatisticElem } from "../../shared/StatisticElement";
import { AlertComponent } from "../../component/alert/alert.component";
import { MessageService } from "../../service/message.service";
import { NavbarService } from "../../service/navbar.service";
import { SettingsService } from "../../service/settings.service";
import { ModalService } from "../../service/modal.service";
import { SubscriptionManager } from "../../shared/SubscriptionManager";

@Component({
	selector       : 'app-transcription',
	templateUrl    : 'transcription.component.html',
	styleUrls      : [ 'transcription.component.css' ],
	providers      : [ MessageService ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptionComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, OnChanges {
	private subscrmanager: SubscriptionManager;

	@ViewChild('modal_shortcuts') modal_shortcuts: ModalComponent;
	@ViewChild('modal_rules') modal_rules: ModalComponent;
	@ViewChild('modal_overview') overview: ModalComponent;

	private initialized: any = {};
	private viewinitialized = false;

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
		return this.audio.loaded;
	}

	get appc(): any {
		return this.settingsService.app_settings;
	}

	get responsive(): boolean {
		return this.appc.octra.responsive.enabled;
	}

	user: number;

	private platform = BrowserInfo.platform;

	constructor(private router: Router,
				private audio: AudioService,
				private uiService: UserInteractionsService,
				private tranService: TranscriptionService,
				private sessService: SessionService,
				private keyMap: KeymappingService,
				private changeDetecorRef: ChangeDetectorRef,
				private navbarServ: NavbarService,
				private settingsService: SettingsService,
				private modService: ModalService) {
		this.subscrmanager = new SubscriptionManager();

		setInterval(() => {
			this.changeDetecorRef.markForCheck();
		}, 2000);
	}

	get dat(): string {
		return JSON.stringify(this.tranService.exportDataToJSON(), null, 3);
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
		if (this.audio.audiobuffer == null) {
			this.subscrmanager.add(this.audio.afterloaded.subscribe(this.afterAudioLoaded));

			if (this.app_settings.octra.logging == true) {
				this.subscrmanager.add(
					this.uiService.afteradd.subscribe((elem) => {
						this.sessService.save("logs", this.uiService.elementsToAnyArray());
					}));
			}
			this.tranService.loadAudioFile();
			this.initialized[ "audiolayer" ] = false;
		}
		else {
			this.afterAudioLoaded();
		}
	}

	afterAudioLoaded = () => {
		this.sessService.SampleRate = this.audio.samplerate;
		this.change();
		this.navbarServ.show_hidden = true;
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
		this.tranService.destroy();
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
			if (!this.modal_rules.visible)
				this.modal_rules.open();
			else this.modal_rules.dismiss();
			$event.preventDefault();
		}
		if ($event.altKey && $event.which == 48) {
			if (!this.overview.visible) {
				this.tranService.analyse();
				this.overview.open();
			}
			else this.overview.dismiss();
			$event.preventDefault();
		}
	}

	getText() {
		return this.tranService.getTranscriptString("text");
	}
}
