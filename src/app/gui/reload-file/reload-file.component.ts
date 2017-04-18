import { Component, OnInit, ViewChild} from '@angular/core';
import { SessionService } from "../../service/session.service";
import { SessionFile } from "../../shared/SessionFile";
import { FileSize, Functions } from "../../shared/Functions";
import { Router } from "@angular/router";
import { TranscriptionService } from "../../service/transcription.service";
import { DropZoneComponent } from "../../component/drop-zone/drop-zone.component";
import { ModalService } from "../../service/modal.service";
import { TranslateService } from "@ngx-translate/core";
import { isNullOrUndefined } from "util";

@Component({
	selector   : 'app-reload-file',
	templateUrl: './reload-file.component.html',
	styleUrls  : [ './reload-file.component.css' ]
})
export class ReloadFileComponent implements OnInit {
	@ViewChild("dropzone") dropzone: DropZoneComponent;

	private error: string = "";

	constructor(public router: Router,
				public sessServ: SessionService,
				public transcrServ: TranscriptionService,
				public modService: ModalService,
				public langService: TranslateService) {
	}

	get sessionfile(): SessionFile {
		return this.sessServ.sessionfile;
	}

	ngOnInit() {
	}

	private navigate() {
		console.log("go to user load");
		this.router.navigate([ '/user/load' ]);
	}

	getDropzoneFileString(file: File | SessionFile) {
		let fsize: FileSize = Functions.getFileSize(file.size);
		return Functions.buildStr("{0} ({1} {2})", [ file.name, (Math.round(fsize.size * 100) / 100), fsize.label ]);
	}

	abortTranscription = () => {
		this.router.navigate([ '/logout' ]);
	};

	newTranscription = () => {
		this.sessServ.sessionfile = this.getSessionFile(this.dropzone.file);
		this.sessServ.file = this.dropzone.file;

		this.sessServ.transcription = [];
		this.transcrServ.segments = null;

		this.sessServ.offline = true;
		this.navigate();
	};

	onOfflineSubmit = () => {
		let type: string = (this.sessServ.sessionfile.type) ? this.sessServ.sessionfile.type : this.langService.instant("general.unknown");

		if (this.dropzone.file != null && this.sessServ.sessionfile != null && this.validate(this.dropzone.file)) {
			if (
				this.dropzone.file.name != this.sessServ.sessionfile.name
				|| this.dropzone.file.type != this.sessServ.sessionfile.type
				|| this.dropzone.file.size != this.sessServ.sessionfile.size
			) {
				this.showErrorMessage(this.langService.instant("reload-file.another file selected",
					{ file: this.getDropzoneFileString(this.sessServ.sessionfile) }
				));
			}
			else {
				//navigate
				this.sessServ.sessionfile = this.getSessionFile(this.dropzone.file);
				this.sessServ.file = this.dropzone.file;

				this.sessServ.offline = true;
				this.navigate();
			}
		}
		else {
			this.showErrorMessage(this.langService.instant("reload-file.file not supported", { type: type }));
		}
	};

	private showErrorMessage(err: string) {
		this.error = err;
		this.modService.show("error", err, null);
	}

	getSessionFile(file: File) {
		return new SessionFile(
			file.name,
			file.size,
			file.lastModifiedDate,
			file.type
		);
	}

	validate(file:any):boolean{
		return (!isNullOrUndefined(file)
			&& (file.type == "audio/wav" || file.type == "audio/x-wav")
		);
	}
}
