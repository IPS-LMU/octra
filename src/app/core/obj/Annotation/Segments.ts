import {Segment} from './Segment';
import {EventEmitter} from '@angular/core';
import {ISegment, OLabel, OSegment} from './AnnotJSON';
import {BrowserAudioTime, BrowserSample, OriginalAudioTime} from '../../../media-components/obj/media/audio';

export class Segments {
  public onsegmentchange: EventEmitter<void> = new EventEmitter<void>();

  get length(): number {
    return this._segments.length;
  }

  private _segments: Segment[];

  get segments(): Segment[] {
    return this._segments;
  }

  set segments(value: Segment[]) {
    this._segments = value;
  }

  constructor(private browserSampleRate: number, segments: ISegment[], lastSamples: {
    browser: number,
    original: number
  }, private _originalSampleRate: number) {
    this._segments = [];

    if (segments !== null) {
      if (segments.length === 0) {
        this._segments.push(new Segment(new BrowserAudioTime(
          new BrowserSample(lastSamples.browser, browserSampleRate
          ), this._originalSampleRate)));
      }

      for (let i = 0; i < segments.length; i++) {
        // divide samples through sampleRateFactor in order to get decodedValue
        segments[i].sampleDur = Math.round(segments[i].sampleDur);
        segments[i].sampleStart = Math.round(segments[i].sampleStart);

        const new_segment = Segment.fromObj(segments[i], this._originalSampleRate, browserSampleRate);

        this._segments.push(new_segment);
      }
    }
  }

  /**
   * adds new Segment
   * @param time_samples
   * @returns {boolean}
   */
  public add(time: BrowserAudioTime | OriginalAudioTime, transcript: string = null): boolean {
    const newSegment: Segment = new Segment(time);

    if (!(transcript === null || transcript === undefined)) {
      newSegment.transcript = transcript;
    }

    this.segments.push(newSegment);
    this.sort();
    this.cleanup();
    return true;
  }

  /**
   * removes Segment by number of samples
   * @param time
   */
  public removeBySamples(timeSamples: BrowserSample) {
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].time.browserSample.equals(timeSamples)) {
        this.segments.splice(i, 1);

        this.onsegmentchange.emit();
      }
    }
  }

  public removeByIndex(index: number, breakmarker: string) {
    if (index > -1 && index < this.segments.length) {
      if (index < this.segments.length - 1) {
        const next_segment = this.segments[index + 1];
        const transcription: string = this.segments[index].transcript;
        if (next_segment.transcript !== breakmarker && transcription !== breakmarker) {
          // concat transcripts
          if (next_segment.transcript !== '' && transcription !== '') {
            next_segment.transcript = transcription + ' ' + next_segment.transcript;
          } else if (next_segment.transcript === '' && transcription !== '') {
            next_segment.transcript = transcription;
          }
        } else if (next_segment.transcript === breakmarker) {
          // delete pause
          next_segment.transcript = transcription;
        }
      }

      this.segments.splice(index, 1);
      this.onsegmentchange.emit();
    }
  }

  /**
   * changes samples of segment by given index and sorts the List after adding
   * @param i
   * @param new_time
   * @returns {boolean}
   */
  public change(i: number, segment: Segment): boolean {
    if (i > -1 && this._segments[i]) {
      const old = {
        samples: this._segments[i].time.browserSample.value,
        transcript: this._segments[i].transcript
      };

      this._segments[i].time.browserSample.value = segment.time.browserSample.value;
      this._segments[i].transcript = segment.transcript;

      if (old.samples !== segment.time.browserSample.value || old.transcript !== segment.transcript) {
        this.onsegmentchange.emit();
        return true;
      }
    }
    return false;
  }

  /**
   * sorts the segments by time in samples
   */
  public sort() {
    this.segments.sort(function (a, b) {
      if (a.time.browserSample.value < b.time.browserSample.value) {
        return -1;
      }
      if (a.time.browserSample.value === b.time.browserSample.value) {
        return 0;
      }
      if (a.time.browserSample.value > b.time.browserSample.value) {
        return 1;
      }
    });

    this.onsegmentchange.emit();
  }

  /**
   * gets Segment by index
   * @param i
   * @returns {any}
   */
  public get(i: number): Segment {
    if (i > -1 && i < this.segments.length) {
      return this.segments[i];
    }
    return null;
  }

  public getFullTranscription(): string {
    let result = '';

    for (let i = 0; i < this.segments.length; i++) {
      result += ' ' + this.segments[i].transcript;
    }

    return result;
  }

  /**
   * returns the segment by the sample position (BrowserSample)
   * @param samples
   */
  public getSegmentBySamplePosition(samples: BrowserSample): number {
    let begin = 0;
    for (let i = 0; i < this._segments.length; i++) {
      if (i > 0) {
        begin = this._segments[i - 1].time.browserSample.value;
      }
      if (samples.value > begin.valueOf() && samples.value <= this._segments[i].time.browserSample.value) {
        return i;
      }
    }
    return -1;
  }

  public getSegmentsOfRange(start_samples: number, end_samples: number): Segment[] {
    const result: Segment[] = [];
    let start = 0;

    for (let i = 0; i < this._segments.length; i++) {
      const segment = this._segments[i];
      if (
        (segment.time.browserSample.value >= start_samples && segment.time.browserSample.value <= end_samples) ||
        (start >= start_samples && start <= end_samples)
        ||
        (start <= start_samples && segment.time.browserSample.value >= end_samples)

      ) {
        result.push(segment);
      }
      start = segment.time.browserSample.value;
    }

    return result;
  }

  public getStartTime(id: number): BrowserAudioTime {
    const segment = this.get(id);
    let samples = 0;

    if (segment) {
      for (let i = 0; i < this.segments.length; i++) {
        if (id === i) {
          const res: BrowserAudioTime = <BrowserAudioTime>segment.time.clone();
          res.browserSample.value = samples;
          return res;
        }

        samples = this.get(i).time.browserSample.value;
      }
    }
    return null;
  }

  public BetweenWhichSegment(samples: number): Segment {
    let start = 0;

    for (let i = 0; i < this.segments.length; i++) {
      if (samples >= start && samples <= this.segments[i].time.browserSample.value) {
        return this.segments[i];
      }
      start = this.segments[i].time.browserSample.value;
    }

    return null;
  }

  public clear() {
    this._segments = [];
  }

  /**
   * returns an array of normal segment objects with original values.
   * @param labelname
   * @param lastOriginalSample
   */
  public getObj(labelname: string, lastOriginalSample: number): OSegment[] {
    const result: OSegment[] = [];

    let start = 0;
    for (let i = 0; i < this._segments.length; i++) {
      const segment = this._segments[i];
      const labels: OLabel[] = [];
      labels.push(new OLabel(labelname, segment.transcript));

      let annotSegment = null;
      if (i < this._segments.length - 1) {
        annotSegment = new OSegment((i + 1), start, (segment.time.originalSample.value - start), labels);
      } else {
        annotSegment = new OSegment((i + 1), start, lastOriginalSample - start, labels);
      }
      result.push(annotSegment);

      start = Math.round(segment.time.originalSample.value);
    }

    return result;
  }

  public clone(): Segments {
    const result = new Segments(this.browserSampleRate, null, {
      browser: this.segments[this.length - 1].time.browserSample.value,
      original: this.segments[this.length - 1].time.originalSample.value
    }, this._originalSampleRate);
    for (let i = 0; i < this.segments.length; i++) {
      result.add(this.segments[i].time, this.segments[i].transcript);
    }
    return result;
  }

  private cleanup() {
    const remove: number[] = [];

    for (let i = 0; i < this.segments.length; i++) {
      if (i > 0) {
        const last = this.segments[i - 1];
        if (last.time.browserSample.value === this.segments[i].time.browserSample.value) {
          remove.push(i);
        }
      }
    }

    for (let i = 0; i < remove.length; i++) {
      this.segments.splice(remove[i], 1);
      remove.splice(i, 1);
      --i;
    }
  }
}
