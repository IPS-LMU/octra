import {Segment} from './Segment';
import {EventEmitter} from '@angular/core';
import {ISegment, OLabel, OSegment} from './AnnotJSON';
import {SampleUnit} from '../audio';

export interface SegmentChangeEvent {
  type: 'remove' | 'change' | 'add';
  oldNum: number;
  oldID: number;
}

export class Segments {
  public onsegmentchange: EventEmitter<SegmentChangeEvent> = new EventEmitter<SegmentChangeEvent>();

  constructor(private sampleRate, segments: ISegment[], lastSampleUnit: SampleUnit) {
    this._segments = [];
    console.log(`LAST SAMPLE is ${lastSampleUnit.seconds}`);

    if (segments !== null) {
      if (segments.length === 0) {
        this._segments.push(new Segment(lastSampleUnit));
      }

      for (const segment of segments) {
        // divide samples through sampleRateFactor in order to get decodedValue
        segment.sampleDur = Math.round(segment.sampleDur);
        segment.sampleStart = Math.round(segment.sampleStart);

        const newSegment = Segment.fromObj(segment, sampleRate);

        this._segments.push(newSegment);
      }
    }
  }

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

  /**
   * adds new Segment
   */
  public add(time: SampleUnit, transcript: string = null): boolean {
    const newSegment: Segment = new Segment(time);

    if (!(transcript === null || transcript === undefined)) {
      newSegment.transcript = transcript;
    }

    this.segments.push(newSegment);
    this.sort();
    this.cleanup();
    this.onsegmentchange.emit({
      type: 'add',
      oldNum: -1,
      oldID: newSegment.id
    });
    return true;
  }

  /**
   * removes Segment by number of samples
   */
  public removeBySamples(timeSamples: SampleUnit) {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];

      if (this.segments[i].time.equals(timeSamples)) {
        this.segments.splice(i, 1);

        this.onsegmentchange.emit({
          type: 'remove',
          oldNum: i,
          oldID: segment.id
        });
      }
    }
  }

  public removeByIndex(index: number, breakmarker: string) {
    if (index > -1 && index < this.segments.length) {
      const segment = this.segments[index];
      if (index < this.segments.length - 1) {
        const nextSegment = this.segments[index + 1];
        const transcription: string = this.segments[index].transcript;
        if (nextSegment.transcript !== breakmarker && transcription !== breakmarker) {
          // concat transcripts
          if (nextSegment.transcript !== '' && transcription !== '') {
            nextSegment.transcript = transcription + ' ' + nextSegment.transcript;
          } else if (nextSegment.transcript === '' && transcription !== '') {
            nextSegment.transcript = transcription;
          }
        } else if (nextSegment.transcript === breakmarker) {
          // delete pause
          nextSegment.transcript = transcription;
        }
      }

      this.segments.splice(index, 1);
      this.onsegmentchange.emit(
        {
          type: 'remove',
          oldNum: index,
          oldID: segment.id
        }
      );
    }
  }

  /**
   * changes samples of segment by given index and sorts the List after adding
   */
  public change(i: number, segment: Segment): boolean {
    if (i > -1 && this._segments[i]) {
      const old = {
        samples: this._segments[i].time.samples,
        transcript: this._segments[i].transcript
      };

      this._segments[i].time = segment.time.clone();
      this._segments[i].transcript = segment.transcript;
      this._segments[i].isBlockedBy = segment.isBlockedBy;

      if (old.samples !== segment.time.samples || old.transcript !== segment.transcript) {
        this.onsegmentchange.emit({
          type: 'change',
          oldNum: i,
          oldID: this._segments[i].id
        });
        return true;
      }
    }
    return false;
  }

  /**
   * sorts the segments by time in samples
   */
  public sort() {
    this.segments.sort((a, b) => {
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
  }

  /**
   * gets Segment by index
   */
  public get(i: number): Segment {
    if (i > -1 && i < this.segments.length) {
      return this.segments[i];
    }
    return null;
  }

  /**
   * gets Segment by ID
   */
  public getByID(id: number): Segment | undefined {
    return this.segments.find(a => a.id === id);
  }

  /**
   * gets Segment by ID
   */
  public getNumberByID(id: number): number {
    return this.segments.findIndex(a => a.id === id);
  }

  public getFullTranscription(): string {
    let result = '';

    for (const segment of this.segments) {
      result += ' ' + segment.transcript;
    }

    return result;
  }

  /**
   * returns the segment by the sample position (BrowserSample)
   */
  public getSegmentBySamplePosition(samples: SampleUnit): number {
    let begin = 0;
    for (let i = 0; i < this._segments.length; i++) {
      if (i > 0) {
        begin = this._segments[i - 1].time.samples;
      }
      if (samples.samples > begin.valueOf() && samples.samples <= this._segments[i].time.samples) {
        return i;
      }
    }
    return -1;
  }

  public getSegmentsOfRange(startSamples: SampleUnit, endSamples: SampleUnit): Segment[] {
    const result: Segment[] = [];
    let start = new SampleUnit(0, this.sampleRate);

    for (const segment of this.segments) {
      if (
        (segment.time.samples >= startSamples.samples && segment.time.samples <= endSamples.samples) ||
        (start >= startSamples && start <= endSamples)
        ||
        (start <= startSamples && segment.time.samples >= endSamples.samples)

      ) {
        result.push(segment);
      }
      start = segment.time.clone();
    }

    return result;
  }

  public getStartTime(id: number): SampleUnit {
    const segment = this.get(id);
    let samples = 0;

    if (segment) {
      for (let i = 0; i < this.segments.length; i++) {
        if (id === i) {
          return new SampleUnit(samples, segment.time.sampleRate);
        }

        samples = this.get(i).time.samples;
      }
    }
    return null;
  }

  public BetweenWhichSegment(samples: number): Segment {
    let start = 0;

    for (const segment of this.segments) {
      if (samples >= start && samples <= segment.time.samples) {
        return segment;
      }
      start = segment.time.samples;
    }

    return null;
  }

  public clear() {
    this._segments = [];
  }

  /**
   * returns an array of normal segment objects with original values.
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
        annotSegment = new OSegment((i + 1), start, (segment.time.samples - start), labels);
      } else {
        annotSegment = new OSegment((i + 1), start, lastOriginalSample - start, labels);
      }
      result.push(annotSegment);

      start = Math.round(segment.time.samples);
    }

    return result;
  }

  public clone(): Segments {
    const result = new Segments(this.sampleRate, null, this.segments[this.length - 1].time);
    for (const segment of this.segments) {
      result.add(segment.time, segment.transcript);
    }
    return result;
  }

  private cleanup() {
    const remove: number[] = [];

    if (this.segments.length > 1) {
      let last = this.segments[0];
      for (let i = 1; i < this.segments.length; i++) {
        if (last.time.samples === this.segments[i].time.samples) {
          remove.push(i);
        }
        last = this.segments[i - 1];
      }

      for (let i = 0; i < remove.length; i++) {
        this.segments.splice(remove[i], 1);
        remove.splice(i, 1);
        --i;
      }
    }
  }
}
