// angular
import {Injectable} from '@angular/core';
// other
import {AudioplayerConfig} from '../config';
import {AudioComponentService, AudioService} from '../../../shared/service';
import {AudioChunk, AudioTime, AudioTimeCalculator, AVMousePos, Line, PlayCursor} from '../../../shared';
import {AudioplayerConfigValidator} from '../validator/AudioplayerConfigValidator';


@Injectable()
export class AudioplayerService extends AudioComponentService {
  private drag_playcursor = false;
  private _settings: any;

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

  constructor(protected audio: AudioService) {
    super();
    this._settings = new AudioplayerConfig().Settings;
    this.validateConfig();
  }

  /**
   * initializes the audioplayer
   * @param innerWidth
   */
  public initialize(innerWidth: number) {
    this.audio_px_w = innerWidth;
    this.playcursor = new PlayCursor(0, new AudioTime(0, this.audiomanager.ressource.info.samplerate), innerWidth);
    this.initializeLine(this.audio_px_w, this._settings.height);
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
        // drag playcursor
        this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audio_px_w, this.audiochunk);
        this.audiochunk.playposition = this.PlayCursor.time_pos.clone();
      }
    }

    if (type === 'mouseleave') {
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

    if (this.audiomanager.audioplaying) {
      this.audiochunk.stopPlayback();
    }

    if (this.last_line === null || this.last_line === curr_line) {
      // same line
      // fix margin _settings
      if ($event.type === 'mousedown') {
        if (this.last_line === null || this.last_line.number === this.last_line.number) {
          if (x < this.PlayCursor.absX - 5 && x > this.PlayCursor.absX + 5) {
            // selection disabled
          } else {
            // drag only if audioplaying = false
            this.drag_playcursor = true;
          }
          this.mouse_click_pos.line = curr_line;
          this.mouse_click_pos.absX = this.getAbsXByLine(curr_line, x - curr_line.Pos.x, innerWidth);
          this.audiochunk.playposition.samples = this.mouse_click_pos.timePos.samples;
        }
        this.mouse_down = true;
      } else if ($event.type === 'mouseup') {
        this.mouse_down = false;
        this.drag_playcursor = false;
        // drag playcursor
        this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audio_px_w, this.audiochunk);
        this.audiochunk.startpos = this.PlayCursor.time_pos.clone();
      }
    } else if ($event.type === 'mouseup') {
      this.mouse_down = false;
      this.drag_playcursor = false;
      // drag playcursor
      this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audio_px_w, this.audiochunk);
      this.audiochunk.startpos.samples = this.audioTCalculator.absXChunktoSamples(this.PlayCursor.absX, this.audiochunk);
    }

  }

  /**
   * updates all lines' width and checks if line is defined. If not this method creates a new one.
   * @param innerWidth
   */
  public updateLines(innerWidth: number) {
    this.audio_px_w = innerWidth;
    const w = innerWidth;

    const line = this.last_line;
    if (line) {
      line.number = 0;
      line.Size = {
        width: w,
        height: this._settings.height
      };

    } else {
      this.initializeLine(w, this._settings.height);
    }
  }

  /**
   * creates a new line given height and width.
   * @param w
   * @param h
   */
  initializeLine(w: number, h: number) {
    const size = {
      height: h,
      width: w
    };

    const position = {
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
   * @param audiochunk
   */
  public init(innerWidth: number, audiochunk: AudioChunk) {
    this.AudioPxWidth = innerWidth;
    this.audiochunk = audiochunk;
    this.initialize(innerWidth);
    this.audioTCalculator = new AudioTimeCalculator(this.audiomanager.ressource.info.samplerate,
      this.audiochunk.time.duration, this.AudioPxWidth);
    this.Mousecursor = new AVMousePos(0, 0, 0, new AudioTime(0, this.audiomanager.ressource.info.samplerate));
    this.MouseClickPos = new AVMousePos(0, 0, 0, new AudioTime(0, this.audiomanager.ressource.info.samplerate));
  }

  private validateConfig() {
    const validator: AudioplayerConfigValidator = new AudioplayerConfigValidator();
    const validation = validator.validateObject(this._settings);
    if (!validation.success) {
      throw validation.error;
    }

  }
}
