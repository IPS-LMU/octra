import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {CompatibilityService} from '../service/compatibility.service';
import {SettingsService} from '../service';

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
        if (!(this.settingsService.app_settings === null || this.settingsService.app_settings === undefined)) {
          resolve2();
        } else {
          const subscr = this.settingsService.app_settingsloaded.subscribe(() => {
            resolve2();
            subscr.unsubscribe();
          });
        }
      }).then(() => {
        this.compatibility.testCompability().then((result) => {
          if (result) {
            if (next.url[0].path === 'test') {
              this.router.navigate(['login']);
            }
            resolve(true);
          } else {
            if (next.url[0].path !== 'test') {
              this.router.navigate(['test']);
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
