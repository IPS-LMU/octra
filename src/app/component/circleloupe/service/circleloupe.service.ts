import {Injectable} from '@angular/core';
import {AudioComponentService, AudioService} from '../../../service';

@Injectable()
export class CircleLoupeService extends AudioComponentService {
  constructor(protected audio: AudioService) {
    super(audio);
  }
}
