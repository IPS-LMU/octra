import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import * as fromApplication from '../../store/application';
import * as fromTranscription from '../../store/transcription';
import {Functions, isUnset} from '@octra/utilities';
import {Store} from '@ngrx/store';

@Injectable()
export class ReloadFileGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService,
              private store: Store) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.appStorage.loggedIn !== true) {
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      Functions.navigateTo(this.router, ['/login'], params).catch((error) => {
        console.error(error);
      });
      return false;
    } else {
      const subject = new Subject<boolean>();
      this.store.select(fromTranscription.selectProjectConfig).subscribe((projectConfig)=>{
        if(!isUnset(projectConfig)){
          subject.next(true);
          subject.complete();
        }
      });
    }
  }
}
