import { Injectable } from '@angular/core';

import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { SessionService }  from "../service/session.service";

@Injectable()
export class LogoutGuard implements CanActivate {
	constructor(private sessService:SessionService,
				private router:Router) {

	}

	canActivate(route:ActivatedRouteSnapshot, state:RouterStateSnapshot):Observable<boolean> | boolean {
		//check if an active session is available
		if (this.sessService.logged_in) {
			return true;
		}
		else {
			console.log("go to tanscr from logout");
			this.router.navigate(['/user/transcr']);
		}
		return false;
	}
}