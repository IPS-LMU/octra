import {Injectable} from '@angular/core';

import {AudioComponentService, AudioService} from '../../../service';

@Injectable()
export class LoupeService extends AudioComponentService {
  constructor(protected audio: AudioService) {
    super(audio);
  }
}
