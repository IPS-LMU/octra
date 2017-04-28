import {AudioService} from './audio.service';
import {Line} from '../shared/Line';
import {AudioTime} from '../shared/AudioTime';
import {AVMousePos} from '../shared/AVMousePos';
import {PlayCursor} from '../shared/PlayCursor';
import {AudioTimeCalculator} from '../shared/AudioTimeCalculator';
import {Chunk} from '../shared/Chunk';

export class AudioComponentService {
  // LINES
  protected last_line: Line = null;

  // MOUSE
  protected mouse_down = false;
  protected mouse_click_pos: AVMousePos = new AVMousePos(
    0,
    0,
    0,
    null
  );

  protected mousecursor: AVMousePos = null;
  protected playcursor: PlayCursor = null;
  public lastplayedpos: AudioTime = null;

  // AUDIO
  protected audio_px_w = 0;
  protected distance = 0;
  protected hZoom = 0;
  public current: AudioTime = null;
  private _playduration: AudioTime = null;
  public audioTCalculator: AudioTimeCalculator;

  private chunk: Chunk = null;
  protected audio: AudioService;


  get Chunk(): Chunk {
    return this.chunk;
  }

  set Chunk(new_chunk: Chunk) {
    this.chunk = new_chunk;
  }

  get AudioPxWidth(): number {
    return this.audio_px_w;
  }

  set AudioPxWidth(audio_px: number) {
    this.audio_px_w = audio_px;
  }

  get Distance(): number {
    if (this && this.distance) {
      return this.distance;
    }
    return null;
  }

  get MouseClickPos(): AVMousePos {
    return this.mouse_click_pos;
  }

  set MouseClickPos(mouse_click_pos: AVMousePos) {
    this.mouse_click_pos = mouse_click_pos;
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

  get playduration(): AudioTime {
    return this._playduration;
  }

  set playduration(value: AudioTime) {
    this._playduration = value;
  }

  constructor(audio: AudioService) {
    this.audio = audio;
  }

  public calculateBeginTime(): AudioTime {
    if (this.current.samples >= 0) {
      return this.current.clone();
    } else if (this.Chunk.time.start != null) {
      return this.Chunk.time.start.clone();
    } else {
      return (new AudioTime(0, this.audio.samplerate));
    }
  }

  public updateDistance(): void {
    this.distance = (this.audio_px_w - this.audioTCalculator.samplestoAbsX(this.current.samples));
  }

  public resetAudioMeta() {
    this.mouse_click_pos = new AVMousePos(0, 0, 0, new AudioTime(0, 0));
  }

  public initialize(innerWidth: number) {
  }

  /***
   *        ALL FUNCTIONS RELATED TO MOUSE
   */

  public setMouseMovePosition(type: string, x: number, y: number, curr_line: Line, innerWidth) {
    this.mousecursor.relPos.x = x;
    this.mousecursor.absX = this.getAbsXByLine(curr_line, x, innerWidth);
    this.mousecursor.timePos.samples = this.audioTCalculator.absXChunktoSamples(this.mousecursor.absX, this.Chunk);
    this.mousecursor.relPos.y = y;
    this.mousecursor.line = curr_line;
    this.last_line = curr_line;
  }

  public setMouseClickPosition(x: number, y: number, curr_line: Line, $event: Event, innerWidth: number) {
    this.mousecursor.relPos.x = x;
    this.mousecursor.relPos.y = y;
  }

  public getAbsXByLine(line: Line, rel_x, innerWidth): number {
    return (line.number * innerWidth + rel_x);
  }

  /***
   *        -----------------------------------
   */
}
