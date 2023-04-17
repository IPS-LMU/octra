import { Injectable } from "@angular/core";

import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { AppInfo } from "../../../app.info";
import { AppStorageService } from "../../shared/service/appstorage.service";
import { navigateTo } from "@octra/utilities";

@Injectable()
export class MembersAreaGuard implements CanActivate {

  constructor(private appStorage: AppStorageService, private router: Router) {

  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.appStorage.loggedIn !== true) {
      console.log(`members area logged in false`);
      const params = AppInfo.queryParamsHandling;
      params.fragment = route.fragment;
      params.queryParams = route.queryParams;

      navigateTo(this.router, ['/login'], params).catch((error) => {
        console.error(error);
      });
      return false;
    }
    console.log(`members area logged in true`);

    return true;
  }
}
