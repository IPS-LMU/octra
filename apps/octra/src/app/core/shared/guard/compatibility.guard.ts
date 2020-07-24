import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../service';
import {CompatibilityService} from '../service/compatibility.service';
import {Functions} from '@octra/utilities';

@Injectable({
  providedIn: 'root'
})
export class CompatibilityGuard implements CanActivate {
  constructor(private router: Router, private compatibility: CompatibilityService, private settingsService: SettingsService) {

  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    return new Promise<boolean>((resolve, reject) => {
      new Promise<void>((resolve2, reject2) => {
        if (!(this.settingsService.appSettings === null || this.settingsService.appSettings === undefined)) {
          resolve2();
        } else {
          const subscr = this.settingsService.appsettingsloaded.subscribe(() => {
            resolve2();
            subscr.unsubscribe();
          });
        }
      }).then(() => {
        this.compatibility.testCompability().then((result) => {
          if (result) {
            if (next.url[0].path === 'test') {
              const params = AppInfo.queryParamsHandling;
              params.fragment = next.fragment;
              params.queryParams = next.queryParams;

              Functions.navigateTo(this.router, ['login'], params).catch((error) => {
                console.error(error);
              });
            }
            resolve(true);
          } else {
            if (next.url[0].path !== 'test') {
              const params = AppInfo.queryParamsHandling;
              params.fragment = next.fragment;
              params.queryParams = next.queryParams;

              Functions.navigateTo(this.router, ['test'], params).catch((error) => {
                console.error(error);
              });
              resolve(result);
            } else {
              resolve(true);
            }
          }
        });
      });

    });
  }
}
