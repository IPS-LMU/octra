import {Injectable} from '@angular/core';

import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {SettingsService} from '../service';
import {AppStorageService} from '../service/appstorage.service';
import {Store} from '@ngrx/store';
import * as fromApplication from '../../store/application';
import * as fromTranscription from '../../store/transcription';
import {Functions} from '@octra/utilities';

@Injectable()
export class SettingsGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router,
              private settingsService: SettingsService,
              private store: Store) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const subject = new Subject<boolean>();
    const promises: Promise<void>[] = [];
    promises.push(Functions.afterTrue(this.store.select(fromApplication.selectIDBLoaded)));
    promises.push(Functions.afterDefined(this.store.select(fromApplication.selectAppSettings)));
    promises.push(Functions.afterDefined(this.store.select(fromTranscription.selectProjectConfig)));
    promises.push(Functions.afterDefined(this.store.select(fromTranscription.selectGuideLines)));
    promises.push(Functions.afterDefined(this.store.select(fromTranscription.selectMethods)));

    Promise.all(promises).then(() => {
      console.log(`All Loaded!`);
      subject.next(true);
      subject.complete();
    }).catch((error) => {
      console.error(error);
    });

    return subject;
  }
}
