import {isNullOrUndefined} from 'util';

/**
 * class initialized with samples which can output other units like seconds, miliseconds
 */
export class AudioTime {
  /**
   * converts seconds given sample_rate to Audiotime
   * @param seconds
   * @param sample_rate
   * @returns {AudioTime}
   */
  public static fromSeconds(seconds: number, sample_rate: number): AudioTime {
    return new AudioTime(seconds * sample_rate, sample_rate);
  }

  /**
   * converts miliseconds given sample_rate to Audiotime
   * @param seconds
   * @param sample_rate
   * @returns {AudioTime}
   */
  public static fromMiliSeconds(miliseconds: number, sample_rate: number): AudioTime {
    return new AudioTime(miliseconds / 1000 * sample_rate, sample_rate);
  }

  /**
   * sums two Audiotimes with the same sample rate and returns the result as new AudioTime.
   * @param time1
   * @param time2
   * @returns {AudioTime}
   */
  public static add(time1: AudioTime, time2: AudioTime): AudioTime {
    if (time1._sample_rate === time2._sample_rate) {
      return new AudioTime(
        time1.samples + time2.samples, time1._sample_rate
      );

    } else {
      throw new Error('Two AudioTime Objects of different sample_rates can not be added.');
    }
  }

  /**
   * subs two AudioTimes with the same sample_rate and returns the result as new AudioTime
   * @param time1
   * @param time2
   * @returns {AudioTime}
   */
  public static sub(time1: AudioTime, time2: AudioTime): AudioTime {
    if (time1._sample_rate === time2._sample_rate) {
      return new AudioTime(
        time1.samples - time2.samples, time1._sample_rate
      );

    } else {
      throw new Error('Two AudioTime Objects of different sample_rates can not be added.');
    }
  }

  public static fromSamples(samples: number, samplerate: number): AudioTime {
    if (!isNullOrUndefined(samples) && !isNullOrUndefined(samplerate) && Number.isInteger(samples) && samples > -1) {
      return new AudioTime(samples, samplerate);
    }
    return null;
  }

  set sample_rate(value) {
    this._sample_rate = value;
  }

  get samples(): number {
    return this._samples;
  }

  set samples(value: number) {
    this._samples = value;
  }

  get unix(): number {
    return Math.floor((this.samples * 1000) / this._sample_rate);
  }

  set unix(value: number) {
    this._samples = Math.round((value / 1000) * this._sample_rate);
  }

  get seconds(): number {
    return this.samples / this._sample_rate;
  }

  set seconds(value: number) {
    this.samples = value * this._sample_rate;
  }

  public clone(): AudioTime {
    return new AudioTime(this.samples, this._sample_rate);
  }

  constructor(private _samples: number,
              private _sample_rate: number) {
    if (this._sample_rate <= 0) {
      throw new Error('sample_rate must be bigger than 0');
    }
  }

  public toString(): string {
    return 'Samples: ' + this.samples;
  }

  public toAny(): any {
    return {
      samples: this._samples,
      sample_rate: this._sample_rate
    };
  }
}
