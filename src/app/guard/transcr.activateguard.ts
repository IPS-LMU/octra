import { Injectable} from '@angular/core';

import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { SessionService } from "../service/session.service";
import { SettingsService } from "../service/settings.service";

@Injectable()
export class TranscActivateGuard implements CanActivate {

	constructor(private sessService:SessionService,
				private router:Router,
				private settService:SettingsService
	){

	}
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean
	{
		if(!this.settService.allloaded) {
			console.log("back to user load");
			this.router.navigate(['/user/load']);
			return false;
		}
		return true;
	}
}