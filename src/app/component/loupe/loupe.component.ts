import {
	Component,
	OnInit,
	ViewChild,
	Output,
	EventEmitter
} from '@angular/core';
import { AudioviewerComponent, AudioviewerService } from "../audioviewer";
import { AudioTime, AVMousePos } from "../../shared";
declare var window: any;

@Component({
	selector   : 'app-loupe',
	templateUrl: './loupe.component.html',
	styleUrls  : [ './loupe.component.css' ],
	providers  : [ AudioviewerService ]
})

export class LoupeComponent implements OnInit {
	@ViewChild('viewer') viewer: AudioviewerComponent;
	@Output('statechange') statechange: EventEmitter<string> = new EventEmitter<string>();

	@Output('mousecursorchange') get mousecursorchange(): EventEmitter<AVMousePos> {
		return this.viewer.mousecursorchange;
	}

	@Output('shortcuttriggered') get shortcuttriggered(): EventEmitter<string> {
		return this.viewer.shortcuttriggered;
	}

	@Output('segmententer') get segmententer(): EventEmitter<any> {
		return this.viewer.segmententer;
	}

	public get MouseCursor(): AVMousePos {
		return this.viewer.MouseCursor;
	}

	constructor() {
	}

	public pos: any = {
		x: 0,
		y: 0
	};

	get Settings(): any {
		return this.viewer.Settings;
	}

	set Settings(new_settings: any) {
		this.viewer.Settings = new_settings;
	}

	ngOnInit() {
		this.viewer.Settings.multi_line = false;
		this.viewer.Settings.height = 150;
		this.viewer.Settings.justify_signal_height = true;
		this.viewer.Settings.boundaries.enabled = true;
		this.viewer.Settings.disabled_keys = [];
		this.viewer.Settings.type = "line";
	}

	public changeArea(start: AudioTime, end: AudioTime) {
		this.viewer.changeBuffer(start, end);
	}

	public updateSegments() {
		this.viewer.drawSegments();
	}

	public changeBuffer(start: AudioTime, end: AudioTime) {
		this.viewer.changeBuffer(start, end);
	}

	public update() {
		this.viewer.update();
	}

	onButtonClick(event: {type: string, timestamp: number}) {
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
				this.viewer.rePlayback();
				break;
			case("backward"):
				this.viewer.stepBackward();
				break;
			case("default"):
				break;
		}
	}
}
