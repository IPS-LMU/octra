import {
	Component,
	OnInit,
	OnChanges,
	AfterViewInit,
	AfterContentChecked,
	ViewChild,
	ChangeDetectorRef
} from '@angular/core';

import {
	AudioviewerComponent,
	AudioNavigationComponent,
	LoupeComponent
} from "../../component";
import { TranscrWindowComponent } from "../transcr-window/transcr-window.component";

import { APP_CONFIG } from "../../app.config";
import {
	KeymappingService,
	TranscriptionService,
	AudioService,
	UserInteractionsService,
	MessageService
} from "../../service";

import { AVMousePos, AVSelection, AudioTime, Functions } from "../../shared";
import { SubscriptionManager } from "../../shared/SubscriptionManager";

@Component({
	selector: 'app-overlay-gui',
	templateUrl: 'overlay-gui.component.html',
	styleUrls: [ 'overlay-gui.component.css' ]
})
export class OverlayGUIComponent implements OnInit, AfterViewInit, AfterContentChecked, OnChanges {
	@ViewChild('viewer') viewer: AudioviewerComponent;
	@ViewChild('window') window: TranscrWindowComponent;
	@ViewChild('loupe') loupe: LoupeComponent;
	@ViewChild('audionav') audionav: AudioNavigationComponent;

	private showWindow: boolean = false;
	private subscrmanager:SubscriptionManager;

	constructor(private transcrService: TranscriptionService,
				private keyMap: KeymappingService,
				private audio: AudioService,
				private uiService: UserInteractionsService,
				private cd: ChangeDetectorRef,
				private msg: MessageService) {

		this.subscrmanager = new SubscriptionManager();
	}

	private loupe_hidden = true;

	private mini_loupecoord: any = {
		x: 0,
		y: 0
	};

	private shortcuts: any = {};

	ngOnInit() {
		this.shortcuts = this.keyMap.register("overlay", this.viewer.Settings.shortcuts);

		this.viewer.Settings.multi_line = true;
		this.viewer.Settings.height = 70;
		this.viewer.Settings.justifySignalHeight = true;
		this.viewer.Settings.step_width_ratio = (this.viewer.Settings.pixel_per_sec / this.audio.samplerate);
		this.audionav.shortcuts = this.viewer.Settings.shortcuts;

		this.viewer.alerttriggered.subscribe(
			(result) => {
				this.msg.showMessage(result.type, result.message);
			}
		);
	}

	ngOnChanges(test) {
	}

	ngAfterViewInit() {
		if (this.audio.channel)
			this.viewer.initialize();
	}

	ngAfterContentChecked() {
	}

	onSegmentEntered(selected: any) {
		if (this.transcrService.segments && selected.index > -1 && selected.index < this.transcrService.segments.length) {
			let segment = this.transcrService.segments.get(selected.index);
			if (segment) {
				this.transcrService.selectedSegment = { index: selected.index, pos: selected.pos };
			}
		}

		if (this.transcrService.selectedSegment) {
			this.viewer.deactivate_shortcuts = true;
			this.viewer.focused = false;
			this.showWindow = true;
		}
	}

	onWindowAction(state) {
		if (state === "close") {
			this.showWindow = false;
			this.viewer.deactivate_shortcuts = false;
			this.viewer.drawSegments();
		}
		else if (state === "open") {
		}
	}

	onSegmentSelected(num: number) {
	}

	public get Selection(): AVSelection {
		return this.viewer.Selection;
	}

	onStateChange(state: string) {
	}

	onMouseOver(cursor: AVMousePos) {
		this.changeArea(this.loupe, this.mini_loupecoord);
	}

	onSegmentChange($event) {
	}

	private changeArea(loup: LoupeComponent, coord: any) {
		let cursor = this.viewer.MouseCursor;

		if (cursor && cursor.timePos && cursor.relPos) {
			coord.x = ((cursor.relPos.x) ? cursor.relPos.x - 40 : 0);
			coord.y = ((cursor.line) ? (cursor.line.number + 1) * cursor.line.Size.height + (cursor.line.number) * this.viewer.Settings.margin.bottom : 0);
			let half_rate = Math.round(this.audio.samplerate / 20);
			let start = (cursor.timePos.samples > half_rate)
				? new AudioTime(cursor.timePos.samples - half_rate, this.audio.samplerate)
				: new AudioTime(0, this.audio.samplerate);
			let end = (cursor.timePos.samples < this.audio.duration.samples - half_rate)
				? new AudioTime(cursor.timePos.samples + half_rate, this.audio.samplerate)
				: this.audio.duration.clone();

			if (start && end) {
				loup.changeArea(start, end);
			}
		}
	}

	onShortCutTriggered($event, type) {
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

	onMarkerInsert(marker_code: string) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("marker_insert", { value: marker_code }, Date.now(), 'editor');
	}

	onMarkerClick(marker_code: string) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("marker_click", { value: marker_code }, Date.now(), 'editor');
	}

	onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
		this.audio.speed = event.new_value;
	}

	afterSpeedChange(event: { new_value: number, timestamp: number }) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "speed_change");
	}

	onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
		this.audio.volume = event.new_value;
	}

	afterVolumeChange(event: { new_value: number, timestamp: number }) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "volume_change");
	}

	onButtonClick(event: { type: string, timestamp: number }) {
		if (APP_CONFIG.Settings.LOGGING == true)
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
				this.audionav.replay = this.viewer.rePlayback();
				break;
			case("backward"):
				this.viewer.stepBackward();
				break;
			case("default"):
				break;
		}
	}
}
