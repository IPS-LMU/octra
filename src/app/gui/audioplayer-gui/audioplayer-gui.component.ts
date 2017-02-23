import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { AudioNavigationComponent } from "../../component/audio-navigation/audio-navigation.component";
import { AudioplayerComponent } from "../../component/audioplayer/audioplayer.component";
import { AudioService } from "../../service/audio.service";
import { KeymappingService } from "../../service/keymapping.service";
import { TranscrEditorComponent } from "../../component/transcr-editor/transcr-editor.component";
import { TranscriptionService } from "../../service/transcription.service";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { APP_CONFIG } from "../../app.config";
import { timestamp } from "rxjs/operator/timestamp";
import { Subscription } from "rxjs";
import { Functions } from "../../shared/Functions";

@Component({
	selector   : 'app-audioplayer-gui',
	templateUrl: './audioplayer-gui.component.html',
	styleUrls  : [ './audioplayer-gui.component.css' ]
})
export class AudioplayerGUIComponent implements OnInit, OnDestroy, AfterViewInit {

	@ViewChild("nav") nav: AudioNavigationComponent;
	@ViewChild("audioplayer") audioplayer: AudioplayerComponent;
	@ViewChild('transcr') editor:TranscrEditorComponent;

	private subscriptions:Subscription[] = [];

	public get NavShortCuts() {
		return this.nav.shortcuts;
	}

	public set NavShortCuts(value: any) {
		this.nav.shortcuts = value;
	}

	public get Settings(): any {
		return this.audioplayer.Settings;
	}

	public set Settings(value: any) {
		this.audioplayer.Settings = value;
	}

	constructor(private audio: AudioService,
				private keyMap: KeymappingService,
				private transcr:TranscriptionService,
				private uiService:UserInteractionsService
	) {
	}

	ngOnInit() {
		this.audioplayer.Settings.shortcuts = this.keyMap.register("AP", this.audioplayer.Settings.shortcuts);
		this.nav.shortcuts = this.audioplayer.Settings.shortcuts;
		this.editor.Settings.markers = APP_CONFIG.Settings.MARKERS;
		this.editor.Settings.responsive = APP_CONFIG.Settings.RESPONSIVE;
	}

	ngAfterViewInit(){
		if(this.transcr.segments.length > 0){
			this.editor.rawText = this.transcr.segments.get(0).transcript;
		}
		this.editor.Settings.height = 300;
		this.editor.update();
	}

	ngOnDestroy(){
		Functions.unsubscribeAll(this.subscriptions);
	}

	onButtonClick(event:{type: string, timestamp:number}) {
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("mouse_click", {}, event.timestamp, event.type + "_button");

		switch (event.type) {
			case("play"):
				this.audioplayer.startPlayback();
				break;
			case("pause"):
				this.audioplayer.pausePlayback();
				break;
			case("stop"):
				this.audioplayer.stopPlayback();
				break;
			case("replay"):
				this.nav.replay = this.audioplayer.rePlayback();
				break;
			case("backward"):
				this.audioplayer.stepBackward();
				break;
			case("default"):
				break;
		}
	}

	onSpeedChange(event:{old_value:number, new_value:number, timestamp:number}) {
		this.audio.speed = event.new_value;
	}

	afterSpeedChange(event:{new_value:number, timestamp:number}){
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "speed_change");
	}

	onVolumeChange(event:{old_value:number, new_value:number, timestamp:number}) {
		this.audio.volume = event.new_value;
	}

	afterVolumeChange(event:{new_value:number, timestamp:number}){
		if (APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("slider", event, event.timestamp, "volume_change");
	}

	updateSegment($event){
		let segment = this.transcr.segments.get(0);
		segment.transcript = this.editor.getRawText();
		this.transcr.segments.change(0, segment);
	}

	onShortcutTriggered(event){
		if(APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("shortcut", event, Date.now(), 'audioplayer');
	}

	onMarkerInsert(marker_code: string) {
		if(APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("marker_insert", { value: marker_code }, Date.now(), 'editor');
	}

	onMarkerClick(marker_code: string) {
		this.updateSegment(null);
		if(APP_CONFIG.Settings.LOGGING == true)
			this.uiService.addElementFromEvent("marker_click", { value: marker_code }, Date.now(), 'editor');
	}
}
