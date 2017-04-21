import { Component } from '@angular/core';

import { AudioService } from "../../service/audio.service";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { TranscriptionService } from "../../service/transcription.service";
import { FileService } from "../../service/file.service";
import { Router } from "@angular/router";
import { SettingsService } from "../../service/settings.service";
import { SubscriptionManager } from "../../shared/SubscriptionManager";
import { isNullOrUndefined } from "util";

@Component({
	selector   : 'app-members-area',
	templateUrl: './members-area.component.html',
	styleUrls  : [ './members-area.component.css' ],
	providers  : [ AudioService, UserInteractionsService, TranscriptionService, FileService ]
})
export class MembersAreaComponent{

	subscrmanager:SubscriptionManager = new SubscriptionManager();
	constructor(private router:Router,
		private settService:SettingsService
	) {
	}
}
