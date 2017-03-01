import { Component, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';

import { UserInteractionsService, AudioService } from "../../service";
import { APP_CONFIG } from "../..";
import { BrowserInfo } from "../../shared";

@Component({
	selector   : 'app-audio-navigation',
	templateUrl: 'audio-navigation.component.html',
	styleUrls  : [ 'audio-navigation.component.css' ]
})
export class AudioNavigationComponent {
	get volume(): number {
		return this._volume;
	}

	set volume(value: number) {
		this.volumechange.emit({
			old_value: Number(this._volume),
			new_value: Number(value),
			timestamp: Date.now()
		});
		this._volume = value;
	}

	get appc():any{
		return APP_CONFIG.Settings;
	}

	@Output() buttonclick = new EventEmitter<{type: string, timestamp: number}>();
	@Output() volumechange = new EventEmitter<{old_value: number, new_value: number, timestamp: number}>();
	@Output() aftervolumechange = new EventEmitter<{new_value: number, timestamp: number}>();
	@Output() speedchange = new EventEmitter<{old_value: number, new_value: number, timestamp: number}>();
	@Output() afterspeedchange = new EventEmitter<{new_value: number, timestamp: number}>();

	public shortcuts: any;
	private _volume: number = 1;
	private _speed: number = 1;
	public replay:boolean = false;

	get speed(): number {
		return this._speed;
	}

	set speed(value: number) {
		this.speedchange.emit({
			old_value: Number(this._speed),
			new_value: Number(value),
			timestamp: Date.now()
		});
		this._speed = value;
	}

	constructor(private uiService: UserInteractionsService,
				private audio: AudioService,
				private cd: ChangeDetectorRef) {
	}

	/**
	 * get Shortcut for labels
	 * @param key
	 * @returns {any}
	 */
	private getShortcut(key: string): string {
		if (this.shortcuts) {
			let platform = BrowserInfo.platform;
			if (this.shortcuts[ key ].keys[ platform ]) {
				let shortc = APP_CONFIG.Settings.WRAP[ 0 ] + this.shortcuts[ key ].keys[ platform ] + APP_CONFIG.Settings.WRAP[ 1 ];
				shortc = shortc.replace("BACKSPACE", "DEL");
				return shortc;
			}
		}

		return "";
	}

	/**
	 * called when button of navigation has been clicked
	 * @param type "play", "pause", "stop", "replay" or "backward"
	 */
	onButtonClick(type: string) {
		switch (type) {
			case("play"):
				this.buttonclick.emit({ type: "play", timestamp: Date.now() });
				break;
			case("pause"):
				this.buttonclick.emit({ type: "pause", timestamp: Date.now() });
				break;
			case("stop"):
				this.buttonclick.emit({ type: "stop", timestamp: Date.now() });
				break;
			case("replay"):
				this.buttonclick.emit({ type: "replay", timestamp: Date.now() });
				break;
			case("backward"):
				this.buttonclick.emit({ type: "backward", timestamp: Date.now() });
				break;
			case("default"):
				break;
		}
		this.cd.detectChanges();
	}

	/***
	 * after value of volume was changed
	 */
	afterVolumeChange() {
		this.aftervolumechange.emit({
			new_value: this.volume,
			timestamp: Date.now()
		});
	}

	/***
	 * after value of speed was changed
	 */
	afterSpeedChange() {
		this.afterspeedchange.emit({
			new_value: this.speed,
			timestamp: Date.now()
		});
	}
}
