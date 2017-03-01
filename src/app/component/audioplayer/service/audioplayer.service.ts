//angular
import { Injectable } from '@angular/core';

//other
import { AudioplayerConfig } from "../config";
import { AudioService, AudioComponentService } from "../../../service";
import { AudioTime, PlayCursor, Line, Chunk, AVMousePos, AudioTimeCalculator, AVSelection } from "../../../shared";
import { AudioplayerConfigValidator } from "../validator/AudioplayerConfigValidator";


@Injectable()
export class AudioplayerService extends AudioComponentService {
	private drag_playcursor: boolean = false;
	private _settings: any;
	private _current_time: number = 0;
	private _total_time: number = 0;
	private _begintime: AudioTime = null;
	private _durtime: AudioTime = null;

	set current_time(value: number) {
		this._current_time = value;
	}

	set begintime(value: AudioTime) {
		this._begintime = value;
	}

	get current_time(): number {
		return this._current_time;
	}

	get total_time(): number {
		return this._total_time;
	}

	set total_time(value: number) {
		this._total_time = value;
	}

	get begintime(): AudioTime {
		return this._begintime;
	}

	get Settings(): any {
		return this._settings;
	}

	set Settings(new_settings: any) {
		this._settings = new_settings;
	}

	get Line(): Line {
		return this.last_line;
	}

	get LastLine(): Line {
		return this.last_line;
	}

	get DurTime(): AudioTime {
		return this._durtime;
	}

	set DurTime(new_durtime: AudioTime) {
		this._durtime = new_durtime;
	}

	constructor(protected audio: AudioService) {
		super(audio);
		this._settings = new AudioplayerConfig().Settings;
		this.validateConfig();
	}

	/***
	 * sets the time of duration in seconds
	 */
	public updatePlayDuration() {
		if (this.Chunk && this.Chunk.time.start.samples >= 0 && this.Chunk.time.end.samples > this.Chunk.time.start.samples) {
			this.playduration.samples = (this.Chunk.time.end.samples - this.Chunk.time.start.samples);
		}
		else {
			this.playduration = new AudioTime(0, this.audio.samplerate);
		}
	}

	/**
	 * initializes the audioplayer
	 * @param innerWidth
	 */
	public initialize(innerWidth: number) {
		super.initialize(innerWidth);
		this.audio_px_w = innerWidth;
		this.current = new AudioTime(0, this.audio.samplerate);
		this._durtime = new AudioTime(0, this.audio.samplerate);
		this.playduration = this._durtime.clone();
		this.playcursor = new PlayCursor(0, new AudioTime(0, this.audio.samplerate), innerWidth);
		this.initializeLine(this.audio_px_w, this._settings.height);
	}

	/**
	 * updates the distance to destination
	 */
	public updateDistance(): void {
		if (this._durtime.samples == 0) {
			this.distance = this.audio_px_w - this.audioTCalculator.samplestoAbsX(this.current.samples);
		}
		else if (this.Chunk.time.start.samples >= 0 && this.Chunk.time.end.samples > this.Chunk.time.start.samples) {
			//TODO ÄNDERN
			this.distance = this.audio_px_w;
		}
	}

	/**
	 * sets mouse position on moving and updates the drag status of the slider
	 * @param type
	 * @param x
	 * @param y
	 * @param curr_line
	 * @param innerWidth
	 */
	public setMouseMovePosition(type: string, x: number, y: number, curr_line: Line, innerWidth: number) {
		super.setMouseMovePosition(type, x, y, curr_line, innerWidth);

		if (this.mouse_down) {
			if (this.drag_playcursor) {
				//drag playcursor
				this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audio_px_w, this.Chunk);
				this.current.samples = this.PlayCursor.time_pos.samples;
			}
		}

		if (type == "mouseleave") {
			this.drag_playcursor = false;
		}
	}

	/**
	 * sets mouse click position and the current time position of the cursor. It also checks if slider si dropped.
	 * @param x
	 * @param y
	 * @param curr_line
	 * @param $event
	 * @param innerWidth
	 */
	public setMouseClickPosition(x: number, y: number, curr_line: Line, $event: Event, innerWidth: number) {
		super.setMouseClickPosition(x, y, curr_line, $event, innerWidth);

		if (!this.audio.audioplaying) {
			if (this.last_line == null || this.last_line == curr_line) {
				//same line
				//fix margin _settings
				if ($event.type === "mousedown") {
					if (this.last_line == null || this.last_line.number == this.last_line.number) {
						if (x < this.PlayCursor.absX - 5 && x > this.PlayCursor.absX + 5) {
							//selection disabled
						}
						else {
							//drag only if audioplaying = false
							this.drag_playcursor = true;
						}
						this.mouse_click_pos.line = curr_line;
						this.mouse_click_pos.absX = this.getAbsXByLine(curr_line, x - curr_line.Pos.x, innerWidth);
						this.current.samples = this.mouse_click_pos.timePos.samples;
					}
					this.mouse_down = true;
				}
				else if ($event.type === "mouseup") {
					this.mouse_down = false;
					this.drag_playcursor = false;
					//drag playcursor
					this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audio_px_w, this.Chunk);
					this.current.samples = this.PlayCursor.time_pos.samples;
				}
			}
			else if ($event.type === "mouseup") {
				this.mouse_down = false;
				this.drag_playcursor = false;
				//drag playcursor
				this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audio_px_w, this.Chunk);
				this.current.samples = this.audioTCalculator.absXChunktoSamples(this.PlayCursor.absX, this.Chunk);
			}
		}
	}

	/**
	 * updates all lines' width and checks if line is defined. If not this method creates a new one.
	 * @param innerWidth
	 */
	public updateLines(innerWidth: number) {
		this.audio_px_w = innerWidth;
		let w = innerWidth;

		let line = this.last_line;
		if (line) {
			line.number = 0;
			line.Size = {
				width : w,
				height: this._settings.height
			};

		}
		else {
			this.initializeLine(w, this._settings.height);
		}
	}

	/**
	 * creates a new line given height and width.
	 * @param w
	 * @param h
	 */
	initializeLine(w: number, h: number) {
		let size = {
			height: h,
			width : w
		};

		let position = {
			x: this._settings.margin.left,
			y: this._settings.margin.top
		};

		this.last_line = new Line(0, size, position);
	}

	/**
	 * calculates the absolute pixels given line, the relative position and the inner width
	 * @param line
	 * @param rel_x
	 * @param innerWidth
	 * @returns {any}
	 */
	public getAbsXByLine(line: Line, rel_x, innerWidth): number {
		return (line.number * innerWidth + rel_x);
	};

	/**
	 * initializes all attributes needed for initialization of the audioplayer
	 * @param innerWidth
	 */
	public init(innerWidth: number) {
		this.AudioPxWidth = innerWidth;
		this.begintime = new AudioTime(0, this.audio.samplerate);
		this.Chunk = new Chunk(new AVSelection(new AudioTime(0, this.audio.samplerate),
			new AudioTime(this.audio.duration.samples, this.audio.samplerate)));
		this.initialize(innerWidth);
		this._durtime = new AudioTime(this.Chunk.time.length, this.audio.samplerate);
		this.audioTCalculator = new AudioTimeCalculator(this.audio.samplerate, this._durtime, this.AudioPxWidth);
		this.Mousecursor = new AVMousePos(0, 0, 0, new AudioTime(0, this.audio.samplerate));
		this.MouseClickPos = new AVMousePos(0, 0, 0, new AudioTime(0, this.audio.samplerate));
		this.playduration = this._durtime.clone();
		this.total_time = Math.round(this.Chunk.time.end.unix - this.Chunk.time.start.unix);
	}

	private validateConfig() {
		let validator: AudioplayerConfigValidator = new AudioplayerConfigValidator();
		let validation = validator.validateObject(this._settings);
		if (!validation.success)
			throw validation.error;

	}
}
