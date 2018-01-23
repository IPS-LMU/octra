import {Injectable} from '@angular/core';
import {AudioComponentService} from '../../../service';
import {AudioService} from '../../../../core/shared/service';

@Injectable()
export class CircleLoupeService extends AudioComponentService {
  constructor(protected audio: AudioService) {
    super();
  }
}
