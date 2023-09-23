import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { SettingsService } from '../service';
import { CompatibilityService } from '../service/compatibility.service';
import { Store } from '@ngrx/store';
import { navigateTo } from '@octra/ngx-utilities';

@Injectable({
  providedIn: 'root',
})
export class CompatibilityGuard {
  constructor(
    private router: Router,
    private compatibility: CompatibilityService,
    private settingsService: SettingsService,
    private store: Store
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return new Promise<boolean>((resolve, reject) => {
      this.compatibility.testCompability().then((result) => {
        if (result) {
          if (next.url[0].path === 'test') {
            const params = AppInfo.queryParamsHandling;
            params.fragment = next.fragment!;
            params.queryParams = next.queryParams;

            navigateTo(this.router, ['/login'], params).catch((error) => {
              console.error(error);
            });
          }
          resolve(true);
        } else {
          if (next.url[0].path !== 'test') {
            const params = AppInfo.queryParamsHandling;
            params.fragment = next.fragment!;
            params.queryParams = next.queryParams;

            navigateTo(this.router, ['/test'], params).catch((error) => {
              console.error(error);
            });
            resolve(result);
          } else {
            resolve(true);
          }
        }
      });
    });
  }
}
