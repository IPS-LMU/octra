// angular
import {Injectable} from '@angular/core';
// other
import {AudioplayerConfig} from './audioplayer.config';
import {AudioComponentService} from '../../../service';
import {AVMousePos, Line, PlayCursor} from '../../../obj';
import {AudioService} from '../../../../core/shared/service';
import {AudioChunk, AudioTimeCalculator, BrowserAudioTime} from '../../../obj/media/audio';


@Injectable()
export class AudioplayerService extends AudioComponentService {
  private dragPlayCursor = false;
  private _settings: any;

  get Settings(): any {
    return this._settings;
  }

  set Settings(newSettings: any) {
    this._settings = newSettings;
  }

  get Line(): Line {
    return this.lastLine;
  }

  get LastLine(): Line {
    return this.lastLine;
  }

  constructor(protected audio: AudioService) {
    super();
    this._settings = new AudioplayerConfig().settings;
  }

  /**
   * initializes the audioplayer
   */
  public initialize(innerWidth: number) {
    this.audioPxW = innerWidth;
    this.playcursor = new PlayCursor(0, this.audiomanager.createBrowserAudioTime(0), innerWidth);
    this.initializeLine(this.audioPxW, this._settings.height);
  }

  /**
   * sets mouse position on moving and updates the drag status of the slider
   */
  public setMouseMovePosition(type: string, x: number, y: number, currLine: Line, innerWidth: number) {
    super.setMouseMovePosition(type, x, y, currLine, innerWidth);

    if (this.mouseDown) {
      if (this.dragPlayCursor) {
        // drag playcursor
        this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audioPxW, this.audiochunk);
        this.audiochunk.playposition = this.PlayCursor.time_pos.clone();
      }
    }

    if (type === 'mouseleave') {
      this.dragPlayCursor = false;
    }
  }

  /**
   * sets mouse click position and the current time position of the cursor. It also checks if slider si dropped.
   */
  public setMouseClickPosition(x: number, y: number, currLine: Line, $event: Event, innerWidth: number) {
    super.setMouseClickPosition(x, y, currLine, $event, innerWidth);

    if (this.lastLine === null || this.lastLine === currLine) {
      // same line
      // fix margin _settings
      if ($event.type === 'mousedown') {
        if (this.lastLine === null || this.lastLine.number === this.lastLine.number) {
          if (x < this.PlayCursor.absX - 5 && x > this.PlayCursor.absX + 5) {
            // selection disabled
          } else {
            // drag only if audioplaying = false
            this.dragPlayCursor = true;
          }
          this.mouseClickPos.line = currLine;
          this.mouseClickPos.absX = this.getAbsXByLine(currLine, x - currLine.Pos.x, innerWidth);
          this.audiochunk.playposition = this.mouseClickPos.timePos.clone();
        }
        this.mouseDown = true;
      } else if ($event.type === 'mouseup') {
        this.mouseDown = false;
        this.dragPlayCursor = false;
        // drag playcursor
        this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audioPxW, this.audiochunk);
        this.audiochunk.startpos = this.PlayCursor.time_pos.clone();
      }
    } else if ($event.type === 'mouseup') {
      this.mouseDown = false;
      this.dragPlayCursor = false;
      // drag playcursor
      this.PlayCursor.changeAbsX(x - this._settings.margin.left, this.audioTCalculator, this.audioPxW, this.audiochunk);
      this.audiochunk.startpos.browserSample.value = this.audioTCalculator.absXChunktoSamples(this.PlayCursor.absX, this.audiochunk);
    }
  }

  /**
   * updates all lines' width and checks if line is defined. If not this method creates a new one.
   */
  public updateLines(innerWidth: number) {
    this.audioPxW = innerWidth;
    const w = innerWidth;

    const line = this.lastLine;
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

    this.lastLine = new Line(0, size, position);
  }

  /**
   * calculates the absolute pixels given line, the relative position and the inner width
   */
  public getAbsXByLine(line: Line, relX, innerWidth): number {
    return (line.number * innerWidth + relX);
  }

  /**
   * initializes all attributes needed for initialization of the audioplayer
   */
  public init(innerWidth: number, audiochunk: AudioChunk) {
    this.AudioPxWidth = innerWidth;
    this.audiochunk = audiochunk;
    this.initialize(innerWidth);
    this.audioTCalculator = new AudioTimeCalculator(this.audiomanager.ressource.info.samplerate,
      this.audiochunk.time.duration as BrowserAudioTime, this.AudioPxWidth);
    this.Mousecursor = new AVMousePos(0, 0, 0, this.audiomanager.createBrowserAudioTime(0));
    this.MouseClickPos = new AVMousePos(0, 0, 0, this.audiomanager.createBrowserAudioTime(0));
  }
}
