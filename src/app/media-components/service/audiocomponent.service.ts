import {AVMousePos, Line, PlayCursor} from '../obj';
import {AudioTimeCalculator} from '../obj/media/audio';
import {AudioviewerComponent} from '../components/audio/audioviewer';
import {AudioChunk, AudioManager} from '../obj/media/audio/AudioManager';

export class AudioComponentService {
  public audioTCalculator: AudioTimeCalculator;
  // LINES
  protected lastLine: Line = null;
  // MOUSE
  protected mouseDown = false;
  protected mouseClickPos: AVMousePos = new AVMousePos(
    0,
    0,
    0,
    null
  );
  protected mousecursor: AVMousePos = null;
  protected playcursor: PlayCursor = null;
  // AUDIO
  protected audioPxW = 0;
  protected hZoom = 0;
  protected audiochunk: AudioChunk;

  get AudioPxWidth(): number {
    return this.audioPxW;
  }

  set AudioPxWidth(audioPx: number) {
    this.audioPxW = audioPx;
  }

  get MouseClickPos(): AVMousePos {
    return this.mouseClickPos;
  }

  set MouseClickPos(mouseClickPos: AVMousePos) {
    this.mouseClickPos = mouseClickPos;
  }

  get Mousecursor(): any {
    return this.mousecursor;
  }

  set Mousecursor(mousecursor: any) {
    this.mousecursor = mousecursor;
  }

  // PlayCursor in absX
  get PlayCursor(): PlayCursor {
    return this.playcursor;
  }

  set PlayCursor(playcursor: PlayCursor) {
    this.playcursor = playcursor;
  }

  protected get audiomanager(): AudioManager {
    return this.audiochunk.audiomanager;
  }

  constructor() {
  }

  public initialize(innerWidth: number, audiochunk: AudioChunk) {
    this.audiochunk = audiochunk;
  }

  /***
   *        ALL FUNCTIONS RELATED TO MOUSE
   */

  public setMouseMovePosition(type: string, x: number, y: number, currLine: Line, innerWidth) {
    this.mousecursor.relPos.x = x;
    this.mousecursor.absX = this.getAbsXByLine(currLine, x, innerWidth);
    this.mousecursor.timePos.browserSample.value = this.audioTCalculator.absXChunktoSamples(this.mousecursor.absX, this.audiochunk);
    this.mousecursor.relPos.y = y;
    this.mousecursor.line = currLine;
    this.lastLine = currLine;
  }

  public setMouseClickPosition(x: number, y: number, currLine: Line, $event: Event, innerWidth: number, viewer?: AudioviewerComponent) {
    this.mousecursor.relPos.x = x;
    this.mousecursor.relPos.y = y;
  }

  public getAbsXByLine(line: Line, relX, innerWidth): number {
    return (line.number * innerWidth + relX);
  }

  /***
   *        -----------------------------------
   */
}
