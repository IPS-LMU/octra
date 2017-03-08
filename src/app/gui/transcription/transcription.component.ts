import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	AfterContentInit,
	ViewContainerRef,
	QueryList,
	ViewChildren,
	AfterContentChecked,
	AfterViewChecked,
	Output,
	ViewChild,
	EventEmitter,
	HostListener,
	OnChanges,
	ChangeDetectorRef,
	ReflectiveInjector,
	ComponentRef,
	ComponentFactoryResolver,
	ChangeDetectionStrategy,
	Compiler
} from '@angular/core';
import { Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs/Rx"
import { AudioService } from "../../service/audio.service";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { TranscriptionService } from "../../service/transcription.service";

import { SessionService } from "../../service/session.service";
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { KeymappingService } from "../../service/keymapping.service";
import { AudioplayerGUIComponent } from "../audioplayer-gui/audioplayer-gui.component";
import { BrowserInfo } from "../../shared/BrowserInfo";
import { StatisticElem } from "../../shared/StatisticElement";
import { AudioplayerComponent } from "../../component/audioplayer/audioplayer.component";
import { AlertComponent } from "../../component/alert/alert.component";
import { MessageService } from "../../service/message.service";
import { Logger } from "../../shared/Logger";
import { TextConverter } from "../../shared/Converters/TextConverter";
import { NavbarService } from "../../service/navbar.service";
import { SettingsService } from "../../service/settings.service";

@Component({
	selector       : 'app-transcription',
	templateUrl    : 'transcription.component.html',
	styleUrls      : [ 'transcription.component.css' ],
	providers      : [ MessageService ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TranscriptionComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentInit, OnChanges {
	private subscriptions: Subscription[];

	@ViewChild('modal') modal: ModalComponent;
	@ViewChild('modal_shortcuts') modal_shortcuts: ModalComponent;
	@ViewChild('modal_rules') modal_rules: ModalComponent;
	@ViewChild('overview') overview: ModalComponent;
	@ViewChild('audioplayer') audioplayergui: AudioplayerGUIComponent;
	@ViewChild('test') test: ViewContainerRef;
	@ViewChild('alert') alert: AlertComponent;
	@ViewChildren('audioplayer', { read: ViewContainerRef }) viewAudioPlayerRefs: QueryList<AudioplayerGUIComponent>;

	@Output() doIt = new EventEmitter<string>();

	private initialized: any = {};

	private viewinitialized = false;

	get intro_link(): string {
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

	get appc():any{
		return this.settingsService.app_settings;
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
				private navbarServ:NavbarService,
				private settingsService:SettingsService
	) {
		this.subscriptions = [];
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

	private get app_settings(){
		return this.settingsService.app_settings;
	}

	ngOnChanges() {
	}

	ngOnInit() {
		if (this.audio.audiobuffer == null) {
			let subscr: Subscription = this.audio.afterloaded.subscribe(this.afterAudioLoaded);
			this.subscriptions.push(subscr);

			if (this.app_settings.octra.logging == true) {
				let subscr2: Subscription = this.uiService.afteradd.subscribe((elem)=> {
					this.sessService.save("logs", this.uiService.elementsToAnyArray());
				});
				this.subscriptions.push(subscr2);
			}
			this.tranService.loadAudioFile();
			this.initialized[ "audiolayer" ] = false;
		}else{
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

	abortTranscription() {
		this.router.navigate([ '/logout' ]);
	}

	ngAfterContentInit() {
	}

	submitTranscription() {
		this.sessService.TranscriptionTime.end = Date.now();
		this.router.navigate([ '/user/transcr/submit' ]);
	}

	ngOnDestroy() {
		this.tranService.destroy();
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

	getText(){
		return this.tranService.getTranscriptString("text");
	}
}
