import {
	Component,
	OnInit,
	AfterViewInit,
	OnDestroy,
	ViewChild,
	ChangeDetectorRef, HostListener
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
import { isNullOrUndefined } from "util";
import { SessionService } from "../../service/session.service";

@Component({
	selector   : 'app-signal-gui',
	templateUrl: './signal-gui.component.html',
	styleUrls  : [ './signal-gui.component.css' ]
})
export class SignalGUIComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('viewer') viewer: AudioviewerComponent;
	@ViewChild('miniloupe') miniloupe: LoupeComponent;
	@ViewChild('loupe') loupe: LoupeComponent;
	@ViewChild('nav') nav: AudioNavigationComponent;
	@ViewChild('transcr') editor: TranscrEditorComponent;

	private subscrmanager: SubscriptionManager;

	private initialized = false;
	public miniloupe_hidden = true;
	public segmentselected: boolean = false;
	public activeviewer: string = "";

	public mini_loupecoord: any = {
		component: "viewer",
		x: 0,
		y: 0
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
				public settingsService: SettingsService,
				public sessService:SessionService
	) {
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

		this.loupe.Settings.shortcuts = this.keyMap.register("Loupe", this.loupe.Settings.shortcuts);
		this.loupe.Settings.shortcuts.play_pause.keys.mac = "SHIFT + TAB";
		this.loupe.Settings.shortcuts.play_pause.keys.pc = "SHIFT + TAB";
		this.loupe.Settings.shortcuts.step_backward.keys.mac = "SHIFT + ENTER";
		this.loupe.Settings.shortcuts.step_backward.keys.pc = "SHIFT + ENTER";

		this.miniloupe.Settings.shortcuts_enabled = false;
		this.miniloupe.Settings.boundaries.enabled = false;

		//update signaldisplay on changes
		this.subscrmanager.add(Observable.timer(0, 2000).subscribe(
			() => {
				this.viewer.drawSegments();
				this.loupe.viewer.drawSegments();
			}
		));

		this.subscrmanager.add(this.loupe.viewer.segmentchange.subscribe(
			($event) => {
				this.onSegmentChange($event);
			}));

		this.subscrmanager.add(this.loupe.viewer.alerttriggered.subscribe(
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
		this.initialized = true;
		this.cd.detectChanges();
		this.subscrmanager.add(
			this.transcrService.segmentrequested.subscribe(
				(segnumber:number)=>{
					this.openSegment(segnumber);
				}
			)
		);
	}

	test(selection: AVSelection) {
		if (selection) {
			if (selection.end.samples - selection.start.samples > 0) {
				this.segmentselected = false;
				this.loupe.changeArea(selection.start, selection.end);
			}
		}
	}

	onSegmentChange($event) {
		this.loupe.update();
		this.viewer.drawSegments();
	}

	onMouseOver(cursor: AVMousePos) {
		this.mini_loupecoord.component = this.viewer;
		let a = this.viewer.getLocation();
		this.mini_loupecoord.y = a.y - this.viewer.Settings.height
			- (this.miniloupe.Settings.height) - 17;
		this.changeArea(this.miniloupe, this.viewer, this.mini_loupecoord, this.viewer.MouseCursor.timePos.samples, this.viewer.MouseCursor.relPos.x);
	}

	onMouseOver2(cursor: AVMousePos) {
		this.mini_loupecoord.component = this.loupe;
		this.mini_loupecoord.y = this.loupe.getLocation().y - this.loupe.Settings.height
			- (this.miniloupe.Settings.height/2) + 15;
		this.changeArea(this.miniloupe, this.loupe.viewer, this.mini_loupecoord, this.loupe.viewer.MouseCursor.timePos.samples, this.loupe.viewer.MouseCursor.relPos.x);
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
		this.loupe.changeArea(this.transcrService.segments.getStartTime($event.index), segment.time);
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
				this.loupe.viewer.focused = false;
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
		this.loupe.viewer.focused = false;
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

	@HostListener('window:resize', [ '$event' ])
	onResize($event) {
		if(!isNullOrUndefined(this.mini_loupecoord.component)) {

			if(this.mini_loupecoord.component === "viewer"){
				let compute = this.viewer.getLocation();
			this.mini_loupecoord.y = compute.y - this.viewer.Settings.height
				- (this.miniloupe.Settings.height) - 17;
			} else if(this.mini_loupecoord.component === "loupe"){
				let compute = this.loupe.getLocation();
				this.mini_loupecoord.y = compute.y - this.loupe.Settings.height
					- (this.miniloupe.Settings.height/2) + 15;
			}
		}
	}

	public openSegment(segnumber:number) {
		let segment = this.transcrService.segments.get(segnumber);
		this.editor.rawText = segment.transcript;

		this.segmentselected = true;
		this.transcrService.selectedSegment = { index: segnumber, pos: segment.time };
		this.viewer.selectSegment(segnumber);

		this.loupe.changeArea(this.transcrService.segments.getStartTime(segnumber), segment.time);
	}
}
