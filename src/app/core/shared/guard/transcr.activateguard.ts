import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {AppStorageService, SettingsService} from '../service';

@Injectable()
export class TranscActivateGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settService: SettingsService) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    console.log('transcription component opened');
    if (!this.appStorage.uselocalmode) {
      if (!this.settService.allloaded) {
        console.log('go back to load');
        this.router.navigate(['/user/load'], {
          queryParamsHandling: 'preserve'
        });
        return false;
      }
    } else {
      if (!this.settService.allloaded) {
        console.log('go back to reload');
        this.router.navigate(['/user/transcr/reload-file'], {
          queryParamsHandling: 'preserve'
        });
        return false;
      }
    }
    return true;
  }
}
