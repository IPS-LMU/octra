import { Injectable } from '@angular/core';
import { SessionService } from "./session.service";
import { APIService } from "./api.service";
import { TranscriptionSubmitComponent } from "../gui/transcription-submit/transcription-submit.component";
import { TranscriptionService } from "./transcription.service";

@Injectable()
export class LogoutService {
	constructor(private sessService: SessionService
	) {
	}

	public logout(): boolean {
		return this.sessService.clearSession();
	}

}
