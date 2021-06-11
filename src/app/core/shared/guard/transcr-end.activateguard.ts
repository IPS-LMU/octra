import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {AppStorageService} from '../service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../Functions';

@Injectable()
export class TranscrEndGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const subj = new Subject<boolean>();

    new Promise<void>((resolve) => {
      if (this.appStorage.idbloaded) {
        resolve();
      } else {
        this.appStorage.loaded.toPromise().then(() => {
          resolve();
        }).catch((error) => {
          console.error(error);
        });
      }
    }).then(() => {
      if (!this.appStorage.transcriptionEnded && !this.appStorage.submitted) {
        Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling);
        subj.next(false);
      } else {
        subj.next(true);
      }
    });

    return subj;
  }
}
