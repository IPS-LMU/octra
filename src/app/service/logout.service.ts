import {Injectable} from '@angular/core';
import {SessionService} from './session.service';

@Injectable()
export class LogoutService {
  constructor(private sessService: SessionService) {
  }

  public logout(): boolean {
    return this.sessService.clearSession();
  }

}
