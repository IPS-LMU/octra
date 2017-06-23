import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Rx';
import {SessionService} from '../../shared/service/session.service';
import {SettingsService} from '../../shared/service/settings.service';

@Injectable()
export class MembersAreaGuard implements CanActivate {

  constructor(private sessService: SessionService, private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {

    if (this.sessService.LoggedIn !== true) {
      this.router.navigate(['/login']);
      return false;
    } else if (this.sessService.offline === true) {
      if (this.sessService.file == null) {
        // navigate to reload-file
        this.router.navigate(['/user/transcr/reload-file']);
        return false;
      }
    } else if (this.sessService.submitted) {
      this.router.navigate(['/user/transcr/submitted']);
      return false;
    } else if (!this.settService.allloaded) {
            this.router.navigate(['/user/load']);
    }

    return true;
  }
}
