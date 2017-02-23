//angular
import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
	ChangeDetectionStrategy,
	AfterViewInit
} from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';

//other
import {
	BrowserInfo,
	CanvasAnimation,
	Functions,
	Line
} from "../../shared";
import { AudioService, KeymappingService } from "../../service";
import { AudioplayerService } from "./service/audioplayer.service";

@Component({
	selector       : 'app-audioplayer',
	templateUrl    : 'audioplayer.component.html',
	styleUrls      : [ 'audioplayer.component.css' ],
	providers      : [ AudioplayerService ],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioplayerComponent implements OnInit, AfterViewInit, OnDestroy {
	constructor(private audio: AudioService,
				private ap: AudioplayerService,
				private changeDetectorRef: ChangeDetectorRef,
				private keyMap: KeymappingService) {
		let subscr = this.keyMap.onkeydown.subscribe(this.onKeyDown);
		this.subscriptions.push(subscr);
	}

	@ViewChild("audioplay") apview;
	@ViewChild("ap_graphicscan") graphicscanRef: ElementRef;
	@ViewChild("ap_overlaycan") overlaynacRef: ElementRef;
	@ViewChild("ap_playcan") playcanRef: ElementRef;

	@Output() speed_disabled = new EventEmitter<boolean>();
	@Output() shortcuttriggered = new EventEmitter<any>();
	@Output() speed_slider_disabled: boolean = false;

	@Output()
	public get BeginTime(): number {
		return (this.ap.begintime) ? this.ap.begintime.unix : 0;
	}

	@Output('Data') get Data(): any {
		return {
			distance    : (this.ap && this.ap.Distance) ? this.ap.Distance : "",
			duration    : (this.audio.duration) ? this.audio.duration.unix : 0,
			playduration: (this.ap.playduration) ? this.ap.playduration.unix : 0,
			current     : (this.ap.PlayCursor && this.ap.PlayCursor.time_pos) ? this.ap.PlayCursor.time_pos.unix : 0
		};
	}

	public get Settings(): any {
		return this.ap.Settings;
	}

	public set Settings(value: any) {
		this.ap.Settings = value;
	}

	public get total_time(): number {
		return this.ap.total_time;
	}

	public get current_time(): number {
		return this.ap.current_time;
	}


	private subscriptions: Subscription[] = [];

	//canvas Elements
	private graphicscanvas: HTMLCanvasElement = null;
	private overlaycanvas: HTMLCanvasElement = null;
	private playcanvas: HTMLCanvasElement = null;

	//Animator for requesting AnimationFrames
	private anim: CanvasAnimation;

	private context: CanvasRenderingContext2D = null;
	private p_context: CanvasRenderingContext2D = null;

	private timer = null;
	private width: number = 0;
	private height: number = 0;
	private innerWidth: number = 0;
	private oldInnerWidth: number = 0;
	private focused = false;


	ngOnInit() {
		this.anim = new CanvasAnimation(25);
		this.timer = Observable.timer(0, 200);
	}

	ngAfterViewInit() {
		//initialization of canvases
		this.graphicscanvas = this.graphicscanRef.nativeElement;
		this.playcanvas = this.playcanRef.nativeElement;
		this.overlaycanvas = this.overlaynacRef.nativeElement;

		//initailization of width and height of the control
		this.width = this.apview.elementRef.nativeElement.clientWidth;
		this.innerWidth = this.width - this.Settings.margin.left - this.Settings.margin.right;
		this.oldInnerWidth = this.innerWidth;

		this.ap.init(this.innerWidth);
		this.audio.updateChannel();
		this.update();
		this.startTimer();
	}

	ngOnDestroy() {
		this.stopPlayback();
		Functions.unsubscribeAll(this.subscriptions);
	}

	/**
	 * updates the GUI
	 */
	private update = () => {
		this.updateCanvasSizes();
		if (this.audio.channel) {
			this.draw();
		}

		//update oldinnerWidth
		this.oldInnerWidth = this.innerWidth;
	};

	/**
	 * updateCanvasSizes is needed to update the size of the canvas respective to window resizing
	 */
	private updateCanvasSizes() {
		this.width = Number(this.apview.elementRef.nativeElement.clientWidth);
		this.innerWidth = Number(this.width - this.Settings.margin.left - this.Settings.margin.right);
		this.height = (this.Settings.margin.top + this.Settings.height + this.Settings.margin.bottom);
		//set width
		this.graphicscanvas.width = this.width;
		this.overlaycanvas.width = this.width;
		this.playcanvas.width = this.width;

		//set height
		this.graphicscanvas.height = this.height;
		this.overlaycanvas.height = this.height;
		this.playcanvas.height = this.height;
		this.apview.changeStyle("height", this.height.toString() + "px");

		this.ap.updateLines(this.innerWidth);
	}

	/**
	 * drawSignal(array) draws the min-max pairs of values in the canvas
	 *
	 * in a different color. This is probable due to there being only a final
	 * stroke()-command after the loop.
	 *
	 */
	private draw = function () {
		//get canvas
		let line = this.ap.Line;

		if (line) {
			this.clearDisplay();

			this.drawLine();
			this.drawPlayCursorOnly(line);

		}
		else throw "Line Object not found";
	};

	/**
	 * drawGrid(h, v) draws a grid with h horizontal and v vertical lines over the canvas
	 */
	private drawLine() {
		this.context = this.graphicscanvas.getContext("2d");
		this.context.globalAlpha = 1.0;
		this.context.fillStyle = this.Settings.slider.color;

		let x = this.Settings.margin.left;
		let h = this.Settings.height;
		let middle = Math.round(h / 2) - (this.Settings.slider.height / 2);

		this.context.fillRect(x, middle, this.innerWidth, this.Settings.slider.height);
		this.context.stroke();
	};

	/**
	 * clearDisplay() draws a rectangle with the given canvas size and
	 * fills it with a slightly smaller rectangle in the given color.
	 */
	private clearDisplay() {
		//get canvas
		let play_c = this.playcanvas;
		let overlay_c = this.overlaycanvas;
		let line = this.ap.Line;

		if (line) {
			// --- get the appropriate context
			this.p_context = this.playcanvas.getContext("2d");
			this.p_context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);

			// --- get the appropriate context
			this.context = overlay_c.getContext("2d");
			this.context.globalAlpha = 1.0;
			this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);
			this.context.strokeStyle = this.Settings.cursor.color;

			this.context = play_c.getContext("2d");
			this.context.globalAlpha = 1.0;
			this.context.clearRect(line.Pos.x - 1, line.Pos.y - 1, this.innerWidth + 1, line.Size.height + 1);
			this.context.strokeStyle = this.Settings.playcursor.color;

			this.context = this.graphicscanvas.getContext("2d");
			this.context.globalAlpha = 1.0;
			this.context.strokeStyle = this.Settings.framecolor;
			this.context.fillStyle = this.Settings.backgroundcolor;
			this.context.fillRect(0, 0, this.width, this.height);
			//context.strokeRect(line_obj.Pos.x, line_obj.Pos.y, w, settings.height);
		}
		else
			throw "Line Object not found";
	}

	/**
	 * onMouseMove sets the selection to the current x values of the mouse move
	 */
	private onMouseMove($event) {
		let x = $event.offsetX;
		let y = $event.offsetY;

		let curr_line = this.ap.LastLine;

		if (curr_line) {
			this.ap.setMouseMovePosition($event.type, x, y, curr_line, this.innerWidth);
			this.drawPlayCursorOnly(curr_line);
		}
	}

	/**
	 * onClick sets the selection to the current x values of the click
	 */
	private onClick($event) {
		let x = $event.offsetX;
		let y = $event.offsetY;

		let curr_line = this.ap.Line;

		if (curr_line) {
			this.ap.setMouseClickPosition(x, y, curr_line, $event, this.innerWidth);

			this.drawPlayCursorOnly(curr_line);
		}
	}

	private onKeyDown = ($event) => {
		if (this.Settings.shortcuts_enabled) {
			let comboKey = $event.comboKey;

			let platform = BrowserInfo.platform;
			if (this.Settings.shortcuts) {
				let key_active = false;
				for (let shortc in this.Settings.shortcuts) {
					let focuscheck = this.Settings.shortcuts[ "" + shortc + "" ].focusonly == false
						|| (this.Settings.shortcuts[ "" + shortc + "" ].focusonly == this.focused == true);

					if (focuscheck && this.Settings.shortcuts[ "" + shortc + "" ][ "keys" ][ "" + platform + "" ] === comboKey) {
						switch (shortc) {
							case("play_pause"):
								this.shortcuttriggered.emit({ shortcut: comboKey, value: shortc });
								if (this.audio.audioplaying) this.pausePlayback();
								else this.startPlayback();
								key_active = true;
								break;
							case("stop"):
								this.shortcuttriggered.emit({ shortcut: comboKey, value: shortc });
								this.stopPlayback();
								key_active = true;
								break;
							case("step_backward"):
								this.shortcuttriggered.emit({ shortcut: comboKey, value: shortc });
								this.stepBackward();
								key_active = true;
								break;
						}
					}

					if (key_active)
						break;
				}

				if (key_active)
					$event.event.preventDefault();
			}
		}
	};

	/**
	 * playSelection() plays the selected signal fragment. Playback start and duration
	 * depend on the current selection.
	 */
	private playSelection() {
		//calculate time from which audio is played
		this.ap.begintime = this.ap.calculateBeginTime();
		this.ap.updatePlayDuration();
		this.ap.updateDistance();

		//define callback for end event
		let endPlaybackEvent = () => {
			this.audio.audioplaying = false;
			this.audio.javascriptNode.disconnect();

			if (this.audio.paused) {
				this.ap.current.samples = this.ap.PlayCursor.time_pos.samples;
			}
			else {
				if (this.audio.stepbackward) {
				}
				else {
					this.changePlayCursorAbsX(0);
					this.ap.current.samples = 0;
				}
			}

			if (this.audio.replay == true) {
				this.playSelection();
			}

			this.audio.stepbackward = false;
			this.audio.paused = false;
		};

		let drawFunc = () => {
			this.anim.requestFrame(this.drawPlayCursor);
		};

		this.ap.lastplayedpos = this.ap.begintime.clone();
		this.audio.startPlayback(this.ap.begintime, this.ap.DurTime, drawFunc, endPlaybackEvent);
	}

	/**
	 * stops the playback and sets the current playcursor position to 0.
	 */
	public stopPlayback() {
		if (this.audio.stopPlayback()) {
			//state was not audioplaying
			this.ap.current.samples = 0;
			this.changePlayCursorAbsX(0);
			this.drawPlayCursorOnly(this.ap.Line);
		}
	}

	/**
	 * pause playback
	 */
	public pausePlayback() {
		this.audio.pausePlayback();
	}

	/**
	 * start playback
	 */
	public startPlayback() {
		if (!this.audio.audioplaying && this.ap.MouseClickPos.absX < this.ap.AudioPxWidth - 5) {
			this.playSelection();
		}
	}

	/**
	 * starts the timer needed for updating the timestamps for the gui.
	 */
	private startTimer() {
		let timerSubscription = this.timer.subscribe(
			() => {
				if (this.audio.audiobuffer && this.ap.PlayCursor) {
					this.ap.current_time = Math.round(this.ap.PlayCursor.time_pos.unix);
					this.ap.total_time = this.ap.Chunk.time.end.unix - this.ap.Chunk.time.start.unix;
					this.changeDetectorRef.markForCheck();
				}
			}
		);

		this.subscriptions.push(timerSubscription);
	}

	//sets the loop of playback
	public rePlayback(): boolean {
		return this.audio.rePlayback()
	}

	/**
	 *
	 steps back to last position
	 */
	public stepBackward() {
		this.audio.stepBackward(()=> {
			//audio not playing

			if (this.ap.lastplayedpos != null) {
				this.ap.current = this.ap.lastplayedpos.clone();
				this.ap.PlayCursor.changeSamples(this.ap.lastplayedpos.samples, this.ap.audioTCalculator);
				this.drawPlayCursorOnly(this.ap.LastLine);
				this.ap.begintime = this.ap.lastplayedpos.clone();
				this.startPlayback();
			}
		})
	}

	/**
	 * draws the playcursor during animation
	 */
	private drawPlayCursor = () => {
		//get actual time and calculate progress in percentage
		let timestamp = new Date().getTime();
		let currentAbsX = this.ap.audioTCalculator.samplestoAbsX(this.ap.current.samples);
		let progress = 0;
		let absX = 0;

		if (this.audio.endplaying > timestamp && this.audio.audioplaying) {
			//set new position of playcursor
			progress = Math.min((((this.ap.playduration.unix) - (this.audio.endplaying - timestamp)) / (this.ap.playduration.unix)) * this.audio.speed, 1);
			absX = Math.max(0, currentAbsX + (this.ap.Distance * progress));
			this.changePlayCursorAbsX(absX);
		}

		let line = this.ap.Line;

		if (line) {
			this.drawPlayCursorOnly(line);
		}
	};

	/**
	 * draws playcursor at its current position
	 * @param curr_line
	 */
	private drawPlayCursorOnly(curr_line: Line) {
		let relX = this.ap.PlayCursor.absX + this.Settings.margin.left;
		let relY = Math.round((curr_line.Size.height - this.Settings.playcursor.height) / 2);

		if (relX <= curr_line.Size.width + this.Settings.margin.left) {
			this.p_context = this.playcanvas.getContext("2d");
			this.p_context.clearRect(0, 0, this.width, this.height);
			this.p_context.strokeStyle = this.Settings.playcursor.color;
			this.p_context.beginPath();
			this.p_context.moveTo(relX, relY + 1);
			this.p_context.lineTo(relX, relY + this.Settings.playcursor.height);
			this.p_context.globalAlpha = 1;
			this.p_context.lineWidth = this.Settings.playcursor.width;
			this.p_context.stroke();
		}
	}

	/**
	 * changes the playcursors absolute position in pixels to a new one.
	 * @param new_value
	 */
	private changePlayCursorAbsX(new_value: number) {
		this.ap.PlayCursor.changeAbsX(new_value, this.ap.audioTCalculator, this.ap.AudioPxWidth, this.ap.Chunk);
	}


	/**
	 * this method updates the gui on resizing
	 * @param $event
	 */
	@HostListener('window:resize', [ '$event' ])
	private onResize($event) {
		this.width = this.apview.elementRef.nativeElement.clientWidth;
		this.innerWidth = this.width - this.Settings.margin.left - this.Settings.margin.right;

		let ratio = this.innerWidth / this.oldInnerWidth;
		if (this.ap.PlayCursor) {
			this.changePlayCursorAbsX(this.ap.PlayCursor.absX * ratio);


			if (!this.audio.audioplaying) {
				this.ap.current.samples = this.ap.PlayCursor.time_pos.samples;
			}

			if (this.ap.PlayCursor.absX > 0) {
				let line = this.ap.Line;

				if (line) {
					this.drawPlayCursorOnly(line);
				}
			}

			this.update();
		}
	}

	@HostListener("window:beforeunload", [ "$event" ])
	private onReload($event) {
		Functions.unsubscribeAll(this.subscriptions);
	}
}
