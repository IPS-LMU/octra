import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {SettingsService} from '../service';
import {AppStorageService} from '../service/appstorage.service';

@Injectable()
export class SettingsGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if ((this.settingsService.appSettings === null || this.settingsService.appSettings === undefined)) {
      return this.settingsService.settingsloaded;
    } else {
      return this.settingsService.validated;
    }
  }
}
