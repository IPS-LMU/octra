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

import { LoupeComponent, TranscrEditorComponent, AudioNavigationComponent} from "../../component";;
import { KeymappingService, UserInteractionsService, TranscriptionService, AudioService} from "../../service";
import { AudioTime, Functions, Segment, SubscriptionManager} from "../../shared";
import { SettingsService } from "../../service/settings.service";

@Component({
	selector   : 'app-transcr-window',
	templateUrl: './transcr-window.component.html',
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
	public pos_y: number = 0;
	private subscrmanager: SubscriptionManager;

	get appc(): any {
		return this.settingsService.app_settings;
	}

	get responsive():boolean{
		return this.settingsService.app_settings.octra.responsive.enabled;
	}

	get SelectedSegment(): Segment {
		if (this.transcrService.selectedSegment.index > -1) {
			return this.transcrService.segments.get(this.transcrService.selectedSegment.index);
		}

		return null;
	}

	set SelectedSegment(segment: Segment) {
		this.transcrService.segments.get(this.transcrService.selectedSegment.index).transcript;
	}

	constructor(public keyMap: KeymappingService,
				public transcrService: TranscriptionService,
				public audio: AudioService,
				public uiService: UserInteractionsService,
				public settingsService:SettingsService
	) {

		this.subscrmanager = new SubscriptionManager();
	}

	ngOnInit() {
		this.editor.Settings.markers = this.settingsService.markers.items;
		this.editor.Settings.responsive = this.appc.octra.responsive.enabled;

		this.subscrmanager.add(this.editor.loaded.subscribe(
			() => {
				let index = this.transcrService.selectedSegment.index;
				if (index > -1 && this.transcrService.segments && index < this.transcrService.segments.length) {
					this.editor_rawText(this.transcrService.segments.get(this.transcrService.selectedSegment.index).transcript);
				}
			}
		));
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
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

	onButtonClick(event: { type: string, timestamp: number }) {
		if (this.appc.octra.logging == true)
			this.uiService.addElementFromEvent("mouse_click", {}, event.timestamp, event.type + "_button");

		if (event.type === "replay")
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

	onSpeedChange(event: { old_value: number, new_value: number, timestamp: number }) {
		this.audio.speed = event.new_value;
	}

	afterSpeedChange(event: { new_value: number, timestamp: number }) {
		if (this.appc.octra.logging == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "speed_change");
	}

	onVolumeChange(event: { old_value: number, new_value: number, timestamp: number }) {
		this.audio.volume = event.new_value;
	}

	afterVolumeChange(event: { new_value: number, timestamp: number }) {
		if (this.appc.octra.logging == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "volume_change");
	}
}
