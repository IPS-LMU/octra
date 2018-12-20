/**
 * class initialized with samples which can output other units like seconds, miliseconds
 */

export interface SampleTimeValues {
  unix: number;
  seconds: number;
}

export interface Sample {
  value: number;
  sampleRate: number;
}

export class AudioSample implements Sample {
  get sampleRate(): number {
    return this._sampleRate;
  }

  set sampleRate(value: number) {
    this._sampleRate = value;
  }

  get value(): number {
    return this._value;
  }

  set value(value: number) {
    this._value = value;
  }

  private _value: number = null;
  private _sampleRate: number = null;

  constructor(sample: number, sampleRate: number) {
    if (sample >= 0) {
      this._value = sample;
    } else {
      throw Error('sample must be bigger than -1');
    }

    if (sampleRate <= 0) {
      throw Error('sampleRate must be bigger than 0');
    } else {
      this._sampleRate = sampleRate;
    }
  }

  public get unix(): number {
    return Math.floor((this.sampleRate * 1000) / this.sampleRate);
  }

  public set unix(value: number) {
    this._value = value * this._sampleRate / 1000;
  }

  public get seconds(): number {
    return this.sampleRate / this.sampleRate;
  }
}

export class BrowserSample extends AudioSample {
  get name(): string {
    return this._name;
  }

  constructor(sample: number, sampleRate: number) {
    super(sample, sampleRate);
  }

  private _name = 'browserSample';

  public static fromOriginalSample(originalSample: OriginalSample, browserSampleRate: number): BrowserSample {
    // TODO check max last sample?
    const browserSamples = Math.round(originalSample.value * browserSampleRate / originalSample.sampleRate);
    return new BrowserSample(browserSamples, browserSampleRate);
  }

  public equalSampleRate(sample2: BrowserSample) {
    return this.sampleRate === sample2.sampleRate;
  }

  public add(sample2: BrowserSample) {
    if (this.equalSampleRate(sample2)) {
      return new BrowserSample(this.value + sample2.value, this.sampleRate);
    }
    throw Error('can\'t add BrowserSample because the sample rates are different.');
  }

  public sub(sample2: BrowserSample) {
    if (this.equalSampleRate(sample2)) {
      return new BrowserSample(this.value - sample2.value, this.sampleRate);
    }
    throw Error('can\'t sub BrowserSample because the sample rates are different.');
  }

  public equals(sample2: BrowserSample) {
    return this.value === sample2.value && this.sampleRate === sample2.sampleRate;
  }

  public clone(): BrowserSample {
    return new BrowserSample(this.value, this.sampleRate);
  }
}

export class OriginalSample extends AudioSample {
  get name(): string {
    return this._name;
  }

  constructor(sample: number, sampleRate: number) {
    super(sample, sampleRate);
  }

  private _name = 'originalSample';

  public static fromBrowserSample(browserSample: BrowserSample, originalSampleRate: number): OriginalSample {
    // TODO check max last sample?
    const originalSamples = Math.round(browserSample.value * originalSampleRate / browserSample.sampleRate);
    return new OriginalSample(originalSamples, originalSampleRate);
  }

  public add(sample2: OriginalSample): OriginalSample {
    if (this.equalSampleRate(sample2)) {
      return new OriginalSample(this.value + sample2.value, this.sampleRate);
    }
    throw Error('can\'t add OriginalSample because the sample rates are different.');
  }

  public sub(sample2: OriginalSample) {
    if (this.equalSampleRate(sample2)) {
      return new OriginalSample(this.value - sample2.value, this.sampleRate);
    }
    throw Error('can\'t sub OriginalSample because the sample rates are different.');
  }

  public equals(sample2: OriginalSample) {
    return this.value === sample2.value && this.sampleRate === sample2.sampleRate;
  }

  public equalSampleRate(sample2: OriginalSample) {
    return this.sampleRate === sample2.sampleRate;
  }

  public clone(): OriginalSample {
    return new OriginalSample(this.value, this.sampleRate);
  }
}

export class OriginalAudioTime {
  get sampleRates(): { original: null; browser: null } {
    return this._sampleRates;
  }

  get browserSample(): BrowserSample {
    return BrowserSample.fromOriginalSample(this._originalSample, this._sampleRates.browser);
  }

  public get originalSample(): OriginalSample {
    return this._originalSample;
  }

  private _sampleRates = {
    browser: null,
    original: null
  };

  private _originalSample: OriginalSample;

  constructor(originalSample: OriginalSample,
              private browserSampleRate: number) {
    if (browserSampleRate <= 0) {
      throw new Error('originalSampleRate must be bigger than 0');
    } else {
      this._sampleRates.original = originalSample.sampleRate;
      this._sampleRates.browser = browserSampleRate;
      this._originalSample = originalSample.clone();
    }
  }

  /**
   * converts seconds given sample_rate to Audiotime
   * @param seconds
   * @param sample_rate
   * @returns {AudioTime}
   */
  public static fromSeconds(seconds: number, originalSampleRate: number, browserSampleRate: number): OriginalAudioTime {
    const originalSample = new OriginalSample(seconds * originalSampleRate, originalSampleRate);
    return new OriginalAudioTime(originalSample, browserSampleRate);
  }

  /**
   * converts miliseconds given sample_rate to Audiotime
   * @param seconds
   * @param sample_rate
   * @returns {AudioTime}
   */
  public static fromMiliSeconds(miliseconds: number, browserSampleRate: number, originalSampleRate: number): OriginalAudioTime {
    const originalSample = new OriginalSample(miliseconds / 1000 * originalSampleRate, originalSampleRate);
    return new OriginalAudioTime(originalSample, browserSampleRate);
  }

  /**
   * sums two Audiotimes with the same sample rate and returns the result as new AudioTime.
   * @param time1
   * @param time2
   * @returns {AudioTime}
   */
  public static add(time1: OriginalAudioTime, time2: OriginalAudioTime): OriginalAudioTime {
    if (time1._sampleRates.original === time2._sampleRates.original
      && time1._sampleRates.browser === time2._sampleRates.browser) {
      return new OriginalAudioTime(time1.originalSample.add(time2.originalSample), time1._sampleRates.original);

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
  public static sub(time1: OriginalAudioTime, time2: OriginalAudioTime): OriginalAudioTime {
    if (time1._sampleRates.original === time2._sampleRates.original
      && time1._sampleRates.browser === time2._sampleRates.browser) {
      return new OriginalAudioTime(
        time1.originalSample.add(time2.originalSample), time1._sampleRates.original
      );

    } else {
      throw new Error('Two AudioTime Objects of different sample_rates can not be added.');
    }
  }

  public static fromSamples(samples: number, originalSampleRate: number, browserSampleRate: number): OriginalAudioTime {
    if (!(samples === null || samples === undefined)
      && !(originalSampleRate === null || originalSampleRate === undefined)
      && !(originalSampleRate === null || originalSampleRate === undefined)
      && Number.isInteger(samples) && samples > -1) {
      const originalSample = new OriginalSample(samples, originalSampleRate);
      return new OriginalAudioTime(originalSample, browserSampleRate);
    }
    return null;
  }

  public clone(): OriginalAudioTime {
    return new OriginalAudioTime(this.originalSample, this._sampleRates.browser);
  }

  public convertToBrowserAudioTime(): BrowserAudioTime {
    return new BrowserAudioTime(this.browserSample, this._sampleRates.original);
  }

  public toString(): string {
    return 'Samples: ' + this.browserSample.value;
  }

  public toAny(): any {
    return {
      browserSamples: this._sampleRates.browser,
      originalSamples: this._sampleRates.original,
      browserSampleRate: this._sampleRates.browser,
      originalSampleRate: this._sampleRates.original
    };
  }
}

export class BrowserAudioTime {
  get sampleRates(): { original: null; browser: null } {
    return this._sampleRates;
  }

  get browserSample(): BrowserSample {
    return this._browserSample;
  }

  public get originalSample(): OriginalSample {
    return OriginalSample.fromBrowserSample(this._browserSample, this._sampleRates.original);
  }

  private _sampleRates = {
    browser: null,
    original: null
  };

  private _browserSample: BrowserSample;

  constructor(browserSample: BrowserSample,
              private originalSampleRate: number) {
    if (originalSampleRate <= 0) {
      throw new Error('originalSampleRate must be bigger than 0');
    } else {
      this._sampleRates.browser = browserSample.sampleRate;
      this._sampleRates.original = originalSampleRate;
      this._browserSample = browserSample.clone();
    }
  }

  /**
   * converts seconds given sample_rate to Audiotime
   * @param seconds
   * @param sample_rate
   * @returns {BrowserAudioTime}
   */
  public static fromSeconds(seconds: number, browserSampleRate: number, originalSampleRate: number): BrowserAudioTime {
    const browserSample = new BrowserSample(seconds * browserSampleRate, browserSampleRate);
    return new BrowserAudioTime(browserSample, originalSampleRate);
  }

  /**
   * converts miliseconds given sample_rate to Audiotime
   * @param seconds
   * @param sample_rate
   * @returns {BrowserAudioTime}
   */
  public static fromMiliSeconds(miliseconds: number, browserSampleRate: number, originalSampleRate: number): BrowserAudioTime {
    const browserSample = new BrowserSample(miliseconds / 1000 * browserSampleRate, browserSampleRate);
    return new BrowserAudioTime(browserSample, originalSampleRate);
  }

  /**
   * sums two Audiotimes with the same sample rate and returns the result as new BrowserAudioTime.
   * @param time1
   * @param time2
   * @returns {BrowserAudioTime}
   */
  public static add(time1: BrowserAudioTime, time2: BrowserAudioTime): BrowserAudioTime {
    if (time1._sampleRates.original === time2._sampleRates.original
      && time1._sampleRates.browser === time2._sampleRates.browser) {
      return new BrowserAudioTime(time1.browserSample.add(time2.browserSample), time1._sampleRates.original);

    } else {
      throw new Error('Two BrowserAudioTime Objects of different sample_rates can not be added.');
    }
  }

  /**
   * subs two AudioTimes with the same sample_rate and returns the result as new BrowserAudioTime
   * @param time1
   * @param time2
   * @returns {BrowserAudioTime}
   */
  public static sub(time1: BrowserAudioTime, time2: BrowserAudioTime): BrowserAudioTime {
    if (time1._sampleRates.original === time2._sampleRates.original
      && time1._sampleRates.browser === time2._sampleRates.browser) {
      return new BrowserAudioTime(
        time1.browserSample.add(time2.browserSample), time1._sampleRates.original
      );

    } else {
      throw new Error('Two BrowserAudioTime Objects of different sample_rates can not be added.');
    }
  }

  public static fromSamples(samples: number, browserSampleRate: number, originalSampleRate): BrowserAudioTime {
    if (!(samples === null || samples === undefined)
      && !(browserSampleRate === null || browserSampleRate === undefined)
      && !(originalSampleRate === null || originalSampleRate === undefined)
      && Number.isInteger(samples) && samples > -1) {
      const browserSample = new BrowserSample(samples, browserSampleRate);
      return new BrowserAudioTime(browserSample, originalSampleRate);
    }
    return null;
  }

  public clone(): BrowserAudioTime {
    return new BrowserAudioTime(this.browserSample, this._sampleRates.original);
  }

  public toString(): string {
    return 'Samples: ' + this.browserSample.value;
  }

  public toAny(): any {
    return {
      browserSamples: this._sampleRates.browser,
      originalSamples: this._sampleRates.original,
      browserSampleRate: this._sampleRates.browser,
      originalSampleRate: this._sampleRates.original
    };
  }
}
