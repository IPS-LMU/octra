import { Component, OnInit} from '@angular/core';

import { LogoutService } from "../../service/logout.service";
import { Router } from "@angular/router";
import { APIData } from "../../shared/APIData";
import { APIService } from "../../service/api.service";
import { TranscriptionService } from "../../service/transcription.service";

@Component({

	selector: 'app-login',
	templateUrl: './logout.component.html',
	styleUrls: [ './logout.component.css' ],
	providers: [LogoutService]
})
export class LogoutComponent implements OnInit {

	valid = false;

	member = {
		id: "",
		pw: ""
	};

	constructor(
		private logoutService:LogoutService,
		private router:Router
	) {
	}

	ngOnInit() {
		this.logoutService.logout();
		this.router.navigate([ 'login' ]);
	}
}
