import {Segment} from './Segment';
import {AudioTime} from '../media/audio/AudioTime';
import {EventEmitter} from '@angular/core';
import {ISegment, OLabel, OSegment} from './AnnotJSON';
import {isNullOrUndefined} from 'util';

export class Segments {
  set segments(value: Segment[]) {
    this._segments = value;
  }

  public onsegmentchange: EventEmitter<void> = new EventEmitter<void>();

  get segments(): Segment[] {
    return this._segments;
  }

  get length(): number {
    return this._segments.length;
  }

  private _segments: Segment[];

  constructor(private sample_rate: number, segments: ISegment[], last_sample: number) {
    this._segments = [];

    if (segments !== null) {
      if (segments.length === 0) {
        this._segments.push(new Segment(new AudioTime(last_sample, sample_rate)));
      }

      for (let i = 0; i < segments.length; i++) {
        const new_segment = Segment.fromObj(segments[i], sample_rate);
        this._segments.push(new_segment);
      }
    }
  }

  /**
   * adds new Segment
   * @param time_samples
   * @returns {boolean}
   */
  public add(time_samples: number, transcript: string = null): boolean {
    const newSegment: Segment = new Segment(new AudioTime(time_samples, this.sample_rate));

    if (!isNullOrUndefined(transcript)) {
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
  public removeBySamples(time_samples: number) {
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].time.samples === time_samples) {
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
        // TODO change 'P' !
        if (next_segment.transcript !== breakmarker && transcription !== breakmarker) {
          // concat transcripts
          if (next_segment.transcript !== '' && transcription !== '') {
            next_segment.transcript = transcription + ' ' + next_segment.transcript;
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
      this._segments[i].time.samples = segment.time.samples;
      this._segments[i].transcript = segment.transcript;

      this.onsegmentchange.emit();

      return true;
    }
    return false;
  }

  /**
   * sorts the segments by time in samples
   */
  public sort() {
    this.segments.sort(function (a, b) {
      if (a.time.samples < b.time.samples) {
        return -1;
      }
      if (a.time.samples === b.time.samples) {
        return 0;
      }
      if (a.time.samples > b.time.samples) {
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
  public get (i: number): Segment {
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

  public getSegmentBySamplePosition(samples: number): number {
    let begin = 0;
    for (let i = 0; i < this._segments.length; i++) {
      if (i > 0) {
        begin = this._segments[i - 1].time.samples;
      }
      if (samples > begin && samples <= this._segments[i].time.samples) {
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
        (segment.time.samples >= start_samples && segment.time.samples <= end_samples) ||
        (start >= start_samples && start <= end_samples)
        ||
        (start <= start_samples && segment.time.samples >= end_samples)

      ) {
        result.push(segment);
      }
      start = segment.time.samples;
    }

    return result;
  }

  public getStartTime(id: number): AudioTime {
    const segment = this.get(id);
    let samples = 0;

    if (segment) {
      for (let i = 0; i < this.segments.length; i++) {
        if (id === i) {
          const res = segment.time.clone();
          res.samples = samples;
          return res;
        }

        samples = this.get(i).time.samples;
      }
    }
    return null;
  }

  private cleanup() {
    const remove: number[] = [];

    for (let i = 0; i < this.segments.length; i++) {
      if (i > 0) {
        const last = this.segments[i - 1];
        if (last.time.samples === this.segments[i].time.samples) {
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

  public BetweenWhichSegment(samples: number): Segment {
    let start = 0;

    for (let i = 0; i < this.segments.length; i++) {
      if (samples >= start && samples <= this.segments[i].time.samples) {
        return this.segments[i];
      }
      start = this.segments[i].time.samples;
    }

    return null;
  }

  public clear() {
    this._segments = [];
  }

  public getObj(labelname: string): OSegment[] {
    const result: OSegment[] = [];

    let start = 0;
    for (let i = 0; i < this._segments.length; i++) {
      const segment = this._segments[i];
      const labels: OLabel[] = [];
      labels.push(new OLabel(labelname, segment.transcript));

      const annotSegment = new OSegment((i + 1), start, (segment.time.samples - start), labels);
      result.push(annotSegment);

      start = segment.time.samples;
    }

    return result;
  }

  public clone(): Segments {
    const result = new Segments(this.sample_rate, null, this.segments[this.length - 1].time.samples);
    for (let i = 0; i < this.segments.length; i++) {
      result.add(this.segments[i].time.samples, this.segments[i].transcript);
    }
    return result;
  }
}
