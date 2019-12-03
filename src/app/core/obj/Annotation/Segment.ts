import {OSegment} from './AnnotJSON';
import {BrowserAudioTime, OriginalAudioTime, OriginalSample} from '../../../media-components/obj/media/audio';
import {ASRQueueItemType} from '../../shared/service/asr.service';

export class Segment {
  set isBlockedBy(value: ASRQueueItemType) {
    this._isBlockedBy = value;
  }

  get isBlockedBy(): ASRQueueItemType {
    return this._isBlockedBy;
  }

  get transcript(): string {
    return this._transcript;
  }

  set transcript(value: string) {
    if (value !== this._transcript) {
      this.changed = true;
    }
    this._transcript = value;
  }

  get changed(): boolean {
    return this._changed;
  }

  set changed(value: boolean) {
    this._changed = value;
  }

  private _transcript = '';
  private _changed = false;
  private _isBlockedBy: ASRQueueItemType = null;

  constructor(public time: BrowserAudioTime | OriginalAudioTime) {
  }

  /**
   * converts an object to a Segment. The conversion goes from original -> browser samples.
   */
  public static fromObj(obj: OSegment, originalSampleRate: number, browserSampleRate: number): Segment {
    if (obj) {
      const originalAudioTime = new OriginalAudioTime(
        new OriginalSample(obj.sampleStart + obj.sampleDur, originalSampleRate), browserSampleRate
      );
      const browserAudioTime = originalAudioTime.convertToBrowserAudioTime();
      const seg = new Segment(browserAudioTime);

      if (obj.labels[0].value) {
        seg._transcript = obj.labels[0].value;
      }

      return seg;
    }

    return null;
  }

  public clone(): Segment {
    const seg = new Segment(this.time.clone());
    seg.transcript = this.transcript;
    return seg;
  }
}
