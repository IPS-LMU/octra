import {
	Component,
	OnInit,
	AfterViewInit,
	OnDestroy,
	ViewChild,
	ChangeDetectorRef
} from '@angular/core';
import { Observable } from "rxjs";

import {
	AudioviewerComponent,
	LoupeComponent,
	AudioNavigationComponent,
	TranscrEditorComponent
} from "../../component";

import {
	AudioService,
	KeymappingService,
	TranscriptionService,
	UserInteractionsService,
	MessageService
} from "../../service";
import { AVMousePos, AVSelection, SubscriptionManager, AudioTime, Functions, BrowserInfo } from "../../shared";
import { SettingsService } from "../../service/settings.service";

@Component({
	selector   : 'app-signal-gui',
	templateUrl: './signal-gui.component.html',
	styleUrls  : [ './signal-gui.component.css' ]
})
export class SignalGUIComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('viewer') viewer: AudioviewerComponent;
	@ViewChild('loupe') loupe: LoupeComponent;
	@ViewChild('loupee') loupee: LoupeComponent;
	@ViewChild('loupe2') loupe2: LoupeComponent;
	@ViewChild('nav') nav: AudioNavigationComponent;
	@ViewChild('transcr') editor: TranscrEditorComponent;

	private subscrmanager: SubscriptionManager;

	private initialized = false;
	public loupe_hidden = true;
	public loupe2_hidden = true;
	public segmentselected: boolean = false;
	public activeviewer: string = "";

	public mini_loupecoord: any = {
		x: 0,
		y: 0
	};

	public mini_loupecoord2: any = {
		x: 0,
		y: 70
	};

	private temp: any = null;

	private platform = BrowserInfo.platform;

	public get app_settings(): any {
		return this.settingsService.app_settings;
	}

	get segmententer_shortc(): string {
		return (this.viewer.Settings) ? this.viewer.Settings.shortcuts.segment_enter.keys[ this.platform ] : "";
	}

	constructor(public audio: AudioService,
				public msg: MessageService,
				public keyMap: KeymappingService,
				public transcrService: TranscriptionService,
				public cd: ChangeDetectorRef,
				public uiService: UserInteractionsService,
				public settingsService: SettingsService) {
		this.subscrmanager = new SubscriptionManager();
	}

	ngOnInit() {
		this.viewer.Settings.shortcuts = this.keyMap.register("AV", this.viewer.Settings.shortcuts);

		this.viewer.Settings.multi_line = false;
		this.viewer.Settings.height = 80;
		this.viewer.Settings.shortcuts_enabled = true;
		this.viewer.Settings.boundaries.readonly = false;

		this.editor.Settings.markers = this.transcrService.guidelines.markers;
		this.editor.Settings.responsive = this.app_settings.octra.responsive.enabled;

		this.loupee.Settings.shortcuts = this.keyMap.register("Loupe", this.loupee.Settings.shortcuts);
		this.loupee.Settings.shortcuts.play_pause.keys.mac = "SHIFT + TAB";
		this.loupee.Settings.shortcuts.play_pause.keys.pc = "SHIFT + TAB";
		this.loupee.Settings.shortcuts.step_backward.keys.mac = "SHIFT + ENTER";
		this.loupee.Settings.shortcuts.step_backward.keys.pc = "SHIFT + ENTER";

		this.loupe.Settings.shortcuts_enabled = false;
		this.loupe.Settings.boundaries.enabled = false;
		this.loupe2.Settings.shortcuts_enabled = false;
		this.loupe2.Settings.boundaries.enabled = false;

		//update signaldisplay on changes
		this.subscrmanager.add(Observable.timer(0, 2000).subscribe(
			() => {
				this.viewer.drawSegments();
				this.loupee.viewer.drawSegments();
			}
		));

		this.subscrmanager.add(this.loupee.viewer.segmentchange.subscribe(
			($event) => {
				this.onSegmentChange($event);
			}));

		this.subscrmanager.add(this.loupee.viewer.alerttriggered.subscribe(
			(result) => {
				this.msg.showMessage(result.type, result.message);
			}
		));

		this.subscrmanager.add(this.viewer.alerttriggered.subscribe(
			(result) => {
				this.msg.showMessage(result.type, result.message);
			}
		));
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
		this.keyMap.unregister("AV");
		this.keyMap.unregister("Loupe");
	}

	onButtonClick(event: { type: string, timestamp: number }) {
		if (this.app_settings.octra.logging_enabled == true)
			this.uiService.addElementFromEvent("mouse_click", {}, event.timestamp, event.type + "_button");

		switch (event.type) {
			case("play"):
				this.viewer.startPlayback();
				break;
			case("pause"):
				this.viewer.pausePlayback();
				break;
			case("stop"):
				this.viewer.stopPlayback();
				break;
			case("replay"):
				this.nav.replay = this.viewer.rePlayback();
				break;
			case("backward"):
				this.viewer.stepBackward();
				break;
			case("default"):
				break;
		}
	}

	ngAfterViewInit() {
		this.mini_loupecoord2.y = this.loupee.getLocation().y - this.loupee.Settings.height
			- (this.loupe2.Settings.height/2);
		this.initialized = true;
		this.cd.detectChanges();
	}

	test(selection: AVSelection) {
		if (selection) {
			if (selection.end.samples - selection.start.samples > 0) {
				this.segmentselected = false;
				this.loupee.changeArea(selection.start, selection.end);
			}
		}
	}

	onSegmentChange($event) {
		this.loupee.update();
		this.viewer.drawSegments();
	}

	onMouseOver(cursor: AVMousePos) {
		this.changeArea(this.loupe, this.viewer, this.mini_loupecoord, this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x);
	}

	onMouseOver2(cursor: AVMousePos) {
		this.changeArea(this.loupe2, this.loupee.viewer, this.mini_loupecoord2, this.loupee.viewer.MouseCursor.timePos.samples, this.loupee.viewer.MouseCursor.relPos.x);
	}

	private changeArea(loup: LoupeComponent, viewer: AudioviewerComponent, coord: any, cursor: number, relX: number) {
		let range = ((viewer.Chunk.time.duration.samples / this.audio.duration.samples) * this.audio.samplerate) / 2;

		if (cursor && relX > -1) {
			coord.x = ((relX) ? relX - 40 : 0);
			let half_rate = Math.round(range);
			let start = (cursor > half_rate)
				? new AudioTime(cursor - half_rate, this.audio.samplerate)
				: new AudioTime(0, this.audio.samplerate);
			let end = (cursor < this.audio.duration.samples - half_rate)
				? new AudioTime(cursor + half_rate, this.audio.samplerate)
				: this.audio.duration.clone();

			if (start && end) {
				loup.changeArea(start, end);
			}
		}
	}

	onSegmentEnter($event) {
		let segment = this.transcrService.segments.get($event.index);
		this.editor.rawText = segment.transcript;
		this.segmentselected = true;
		this.transcrService.selectedSegment = $event;
		this.loupee.changeArea(this.transcrService.segments.getStartTime($event.index), segment.time);
	}

	//TODO CHANGE!!
	onLoupeSegmentEnter($event) {
		let segment = this.transcrService.segments.get($event.index);
		this.editor.rawText = segment.transcript;
		this.segmentselected = true;
		this.transcrService.selectedSegment = $event;
	}

	onTranscriptionChanged($event) {
		if (this.segmentselected) {
			let index = this.transcrService.selectedSegment.index;
			if (index > -1 && this.transcrService.segments && index < this.transcrService.segments.length) {
				let segment = this.transcrService.segments.get(index);
				this.viewer.focused = false;
				this.loupee.viewer.focused = false;
				segment.transcript = this.editor.rawText;
				this.transcrService.segments.change(index, segment);
			}
		}
	}

	onShortCutTriggered($event, type) {
		if (this.app_settings.octra.logging_enabled) {

			if (
				$event.value == null || !(
					//cursor move by keyboard events are note saved because this would be too much
					Functions.contains($event.value, "cursor") ||
					//disable logging for user test phase, because it would be too much
					Functions.contains($event.value, "play_selection") ||
					Functions.contains($event.value, "segment_enter")
				)
			) {
				this.uiService.addElementFromEvent("shortcut", $event, Date.now(), type);
			}
		}
	}

	/**
	 * hits when user is typing something in the editor
	 * @param status
	 */
	onEditorTyping = (status: string) => {
		this.viewer.focused = false;
		this.loupee.viewer.focused = false;
		if (status === "started") {
			/*
			//if started save old config of special keys
			this.temp = {
				viewer: {
					play_selection: {
						mac: this.viewer.Settings.shortcuts.play_selection.keys.mac,
						pc : this.viewer.Settings.shortcuts.play_selection.keys.pc
					},
					set_boundary  : {
						mac: this.viewer.Settings.shortcuts.set_boundary.keys.mac,
						pc : this.viewer.Settings.shortcuts.set_boundary.keys.pc
					}
				},
				loupe : {
					play_selection: {
						mac: this.loupee.Settings.shortcuts.play_selection.keys.mac,
						pc : this.loupee.Settings.shortcuts.play_selection.keys.pc
					},
					set_boundary  : {
						mac: this.loupee.Settings.shortcuts.set_boundary.keys.mac,
						pc : this.loupee.Settings.shortcuts.set_boundary.keys.pc
					}
				}
			};

			//delete settings directly to avoid changing reference. Deleting keys means to deactivate them
			this.viewer.Settings.shortcuts.play_selection.keys.mac = "";
			this.viewer.Settings.shortcuts.play_selection.keys.pc = "";
			this.viewer.Settings.shortcuts.set_boundary.keys.mac = "";
			this.viewer.Settings.shortcuts.set_boundary.keys.pc = "";
			this.loupee.Settings.shortcuts.play_selection.keys.mac = "";
			this.loupee.Settings.shortcuts.play_selection.keys.pc = "";
			this.loupee.Settings.shortcuts.set_boundary.keys.mac = "";
			this.loupee.Settings.shortcuts.set_boundary.keys.pc = "";
			*/
		}
		else if (status === "stopped") {
			/*
			//reaload old key settings to activate them
			this.viewer.Settings.shortcuts.play_selection.keys.mac = this.temp.viewer.play_selection.mac;
			this.viewer.Settings.shortcuts.play_selection.keys.pc = this.temp.viewer.play_selection.pc;
			this.viewer.Settings.shortcuts.set_boundary.keys.mac = this.temp.viewer.set_boundary.mac;
			this.viewer.Settings.shortcuts.set_boundary.keys.pc = this.temp.viewer.set_boundary.pc;
			this.loupee.Settings.shortcuts.play_selection.keys.mac = this.temp.loupe.play_selection.mac;
			this.loupee.Settings.shortcuts.play_selection.keys.pc = this.temp.loupe.play_selection.pc;
			this.loupee.Settings.shortcuts.set_boundary.keys.mac = this.temp.loupe.set_boundary.mac;
			this.loupee.Settings.shortcuts.set_boundary.keys.pc = this.temp.loupe.set_boundary.pc;*/
		}
	};

	onMarkerInsert(marker_code: string) {
		if (this.app_settings.octra.logging_enabled == true)
			this.uiService.addElementFromEvent("marker_insert", { value: marker_code }, Date.now(), 'editor');
	}

	onMarkerClick(marker_code: string) {
		this.onTranscriptionChanged(null);
		if (this.app_settings.octra.logging_enabled == true)
			this.uiService.addElementFromEvent("marker_click", { value: marker_code }, Date.now(), 'editor');
	}

	onViewerMouseDown($event) {
		this.segmentselected = false;
	}

	onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
		this.audio.speed = event.new_value;
	}

	afterSpeedChange(event: { new_value: number, timestamp: number }) {
		if (this.app_settings.octra.logging_enabled == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "speed_change");
	}

	onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
		this.audio.volume = event.new_value;
	}

	afterVolumeChange(event: { new_value: number, timestamp: number }) {
		if (this.app_settings.octra.logging_enabled == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "volume_change");
	}
}
