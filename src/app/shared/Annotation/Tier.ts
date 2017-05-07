import {OTier} from '../../types/annotation';
import {isNullOrUndefined} from 'util';
import {Segments} from '../Segments';

export class Tier {
  private name: string;
  public segments: Segments;

  public static fromObj(tier: OTier, samplerate: number, last_sample: number): Tier {
    const segments: Segments = new Segments(samplerate, tier.segments, last_sample);
    const result = new Tier(tier.name, segments);

    return result;
  }

  constructor(name: string, segments?: Segments) {
    this.name = name;

    if (!isNullOrUndefined(segments)) {
      this.segments = segments;
    }
  }

  public getObj(): OTier {
    const result: OTier = new OTier();

    result.name = this.name;
    result.segments = this.segments.getObj();

    return result;
  }
}
