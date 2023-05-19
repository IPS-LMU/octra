import { Injectable } from "@angular/core";

import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { AppInfo } from "../../../app.info";
import { AppStorageService } from "../service/appstorage.service";
import { LoginMode } from "../../store";
import { navigateTo } from "@octra/ngx-utilities";

@Injectable()
export class TranscActivateGuard implements CanActivate {

  constructor(private appStorage: AppStorageService,
              private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (!this.appStorage.audioLoaded) {
      console.error(`audio not loaded`);
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      if (this.appStorage.useMode !== LoginMode.LOCAL) {
        navigateTo(this.router, ['/user/load'], params).catch((error) => {
          console.error(error);
        });
      } else {
        navigateTo(this.router, ['/user/transcr/reload-file'], params).catch((error) => {
          console.error(error);
        });
      }
      return false;
    }
    return true;
  }
}
