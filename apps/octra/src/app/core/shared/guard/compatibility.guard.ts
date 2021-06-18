import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../service';
import {CompatibilityService} from '../service/compatibility.service';
import * as fromApplication from '../../store/application';
import {Store} from '@ngrx/store';
import {afterDefined, navigateTo} from '@octra/utilities';

@Injectable({
  providedIn: 'root'
})
export class CompatibilityGuard implements CanActivate {
  constructor(private router: Router,
              private compatibility: CompatibilityService,
              private settingsService: SettingsService,
              private store: Store) {

  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    return new Promise<boolean>((resolve, reject) => {
      new Promise<void>((resolve2, reject2) => {
        if (!(this.settingsService.appSettings === undefined || this.settingsService.appSettings === undefined)) {
          resolve2();
        } else {
          afterDefined(this.store.select(fromApplication.selectAppSettings)).then(resolve2).catch((error) => {
            console.error(error);
          });
        }
      }).then(() => {
        this.compatibility.testCompability().then((result) => {
          if (result) {
            if (next.url[0].path === 'test') {
              const params = AppInfo.queryParamsHandling;
              params.fragment = next.fragment;
              params.queryParams = next.queryParams;

              navigateTo(this.router, ['login'], params).catch((error) => {
                console.error(error);
              });
            }
            resolve(true);
          } else {
            if (next.url[0].path !== 'test') {
              const params = AppInfo.queryParamsHandling;
              params.fragment = next.fragment;
              params.queryParams = next.queryParams;

              navigateTo(this.router, ['test'], params).catch((error) => {
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
