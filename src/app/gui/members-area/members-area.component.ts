import { Component } from '@angular/core';

import { AudioService } from "../../service/audio.service";
import { UserInteractionsService } from "../../service/userInteractions.service";
import { TranscriptionService } from "../../service/transcription.service";
import { MessageService } from "../../service/message.service";
import { HostListener } from "@angular/core/src/metadata/directives";
import { FileService } from "../../service/file.service";

@Component({
	selector   : 'app-members-area',
	templateUrl: 'members-area.component.html',
	styleUrls  : [ 'members-area.component.css' ],
	providers  : [ AudioService, UserInteractionsService, TranscriptionService, FileService ]
})
export class MembersAreaComponent{

	constructor(private audio:AudioService) {
	}
}
