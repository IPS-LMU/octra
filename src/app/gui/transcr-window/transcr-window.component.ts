import {
	Component,
	OnInit,
	OnDestroy,
	AfterViewInit,
	ViewChild,
	Output,
	EventEmitter,
	AfterContentInit
} from '@angular/core';
import { LoupeComponent } from "../../component/loupe/loupe.component";
import { TranscrEditorComponent } from "../../component/transcr-editor/transcr-editor.component";
import { KeymappingService } from "../../service/keymapping.service";
import { AudioTime } from "../../shared/AudioTime";
import { TranscriptionService } from "../../service/transcription.service";
import { Functions } from "../../shared/Functions";
import { Segment } from "../../shared/Segment";
import { AudioService } from "../../service/audio.service";
import { Subscription } from "rxjs/Rx";
import { AudioNavigationComponent } from "../../component/audio-navigation/audio-navigation.component";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { APP_CONFIG } from "../../app.config";

@Component({
	selector   : 'app-transcr-window',
	templateUrl: 'transcr-window.component.html',
	styleUrls  : [ './transcr-window.component.css' ]
})
export class TranscrWindowComponent implements OnInit, AfterContentInit, AfterViewInit, OnDestroy {
	@ViewChild('loupe') loupe: LoupeComponent;
	@ViewChild('editor') editor: TranscrEditorComponent;
	@ViewChild('audionav') audionav: AudioNavigationComponent;

	@Output('act') act: EventEmitter<string> = new EventEmitter<string>();

	@Output('shortcuttriggered') get shortcuttriggered(): EventEmitter<string> {
		return this.loupe.shortcuttriggered;
	}

	@Output('marker_insert') get marker_insert(): EventEmitter<string> {
		return this.editor.marker_insert;
	}

	@Output('marker_click') get marker_click(): EventEmitter<string> {
		return this.editor.marker_click;
	}

	private showWindow: boolean = false;
	private pos_y: number = 0;
	private subscriptions: Subscription[] = [];

	get appc():any{
		return APP_CONFIG.Settings;
	}
	get SelectedSegment(): Segment {
		if (this.transcrService.selectedSegment.index > -1) {
			return this.transcrService.segments.get(this.transcrService.selectedSegment.index);
		}
		else null;
	}

	set SelectedSegment(segment: Segment) {
		this.transcrService.segments.get(this.transcrService.selectedSegment.index).transcript;
	}

	constructor(private keyMap: KeymappingService,
				private transcrService: TranscriptionService,
				private audio: AudioService,
				private uiService: UserInteractionsService) {
	}

	ngOnInit() {
		this.editor.Settings.markers = APP_CONFIG.Settings.MARKERS;
		this.editor.Settings.responsive = APP_CONFIG.Settings.RESPONSIVE;

		let subscription = this.editor.loaded.subscribe(
			() => {
				let index = this.transcrService.selectedSegment.index;
				if (index > -1 && this.transcrService.segments && index < this.transcrService.segments.length) {
					this.editor_rawText(this.transcrService.segments.get(this.transcrService.selectedSegment.index).transcript);
				}
			}
		);

		this.subscriptions.push(subscription);
		this.audionav.shortcuts = this.loupe.Settings.shortcuts;
	}

	ngOnDestroy() {
		Functions.unsubscribeAll(this.subscriptions);
	}

	ngAfterViewInit() {
		this.pos_y = this.transcrService.selectedSegment.pos.Y2;
		let pos_y2 = this.transcrService.selectedSegment.pos.Y1;
		let segment: Segment = this.transcrService.segments.get(this.transcrService.selectedSegment.index);

		let begin = new AudioTime(0, this.audio.samplerate);

		if (this.transcrService.selectedSegment.index > 0) {
			begin = this.transcrService.segments.get(this.transcrService.selectedSegment.index - 1).time.clone();
		}

		Functions.scrollTo(pos_y2, "#window");
		this.loupe.Settings.boundaries.readonly = true;
		this.changeArea(begin, segment.time);
	}

	ngAfterContentInit() {
		this.act.emit("open");
	}

	public close() {
		this.showWindow = false;
		this.act.emit("close");
	}

	public open() {
		this.showWindow = true;
	}

	save() {
		let index = this.transcrService.selectedSegment.index;
		if (index > -1 && this.transcrService.segments && index < this.transcrService.segments.length) {
			let segment = this.transcrService.segments.get(index);
			segment.transcript = this.editor.rawText;
			this.transcrService.segments.change(index, segment);
		}
	}

	public changeArea(absStart: AudioTime, absEnd: AudioTime) {
		this.loupe.changeArea(absStart, absEnd);
	}

	onButtonClick(event: {type: string, timestamp: number}) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("mouse_click", {}, event.timestamp, event.type + "_button");

		if(event.type === "replay")
			this.audionav.replay = !this.audionav.replay;

		this.loupe.onButtonClick(event);
	}

	/**
	 * selects the next segment on the left or on the right side
	 * @param direction
	 */
	goToSegment(direction: string) {
		let index = this.transcrService.selectedSegment.index;
		if (index > -1 && this.transcrService.segments && index < this.transcrService.segments.length) {
			let segment: Segment = this.transcrService.segments.get(index);

			if (direction === "right" && this.transcrService.selectedSegment.index < this.transcrService.segments.length - 1)
				segment = this.transcrService.segments.get(++this.transcrService.selectedSegment.index);
			else if (direction === "left" && this.transcrService.selectedSegment.index > 0)
				segment = this.transcrService.segments.get(--this.transcrService.selectedSegment.index);

			let begin = new AudioTime(0, this.audio.samplerate);

			if (this.transcrService.selectedSegment.index > 0) {
				begin = this.transcrService.segments.get(this.transcrService.selectedSegment.index - 1).time.clone();
			}

			this.editor.rawText = this.transcrService.segments.get(this.transcrService.selectedSegment.index).transcript;
			this.editor.focus();
			this.changeArea(begin, segment.time);
		}
	}

	public editor_rawText(text: string) {
		this.editor.rawText = text;
	}

	onShortCutTriggered($event, type) {
		this.uiService.addElementFromEvent("shortcut", $event, Date.now(), type);
	}

	onMarkerInsert(marker_code: string) {
		this.uiService.addElementFromEvent("marker_insert", { value: marker_code }, Date.now(), 'editor');
	}

	onMarkerClick(marker_code: string) {
		this.uiService.addElementFromEvent("marker_click", { value: marker_code }, Date.now(), 'editor');
	}

	onSpeedChange(event: {old_value: number, new_value: number, timestamp: number}) {
		this.audio.speed = event.new_value;
	}

	afterSpeedChange(event: {new_value: number, timestamp: number}) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "speed_change");
	}

	onVolumeChange(event: {old_value: number, new_value: number, timestamp: number}) {
		this.audio.volume = event.new_value;
	}

	afterVolumeChange(event: {new_value: number, timestamp: number}) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "volume_change");
	}
}
