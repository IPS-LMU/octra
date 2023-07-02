import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { SettingsService } from '../service';
import { AppStorageService } from '../service/appstorage.service';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class SettingsGuard implements CanActivate {
  constructor(
    private appStorage: AppStorageService,
    private router: Router,
    private settingsService: SettingsService,
    private store: Store
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const subject = new Subject<boolean>();

    this.settingsService
      .allLoaded()
      .then(() => {
        console.log(`All Loaded!`);
        subject.next(true);
        subject.complete();
      })
      .catch((error) => {
        console.error(error);
      });

    return subject;
  }
}
