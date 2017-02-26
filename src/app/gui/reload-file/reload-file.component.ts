import { Component, OnInit, ViewChild, Output } from '@angular/core';
import { SessionService } from "../../service/session.service";
import { SessionFile } from "../../shared/SessionFile";
import { FileSize, Functions } from "../../shared/Functions";
import { Router } from "@angular/router";
import { ModalComponent } from "ng2-bs3-modal/components/modal";
import { TranscriptionService } from "../../service/transcription.service";
import { DropZoneComponent } from "../../component/drop-zone/drop-zone.component";
import { isNullOrUndefined } from "util";

@Component({
	selector   : 'app-reload-file',
	templateUrl: './reload-file.component.html',
	styleUrls  : [ './reload-file.component.css' ]
})
export class ReloadFileComponent implements OnInit {
	@ViewChild("modal_leave") modal_leave: ModalComponent;
	@ViewChild("modal_delete") modal_delete: ModalComponent;
	@ViewChild("modal_error") modal_error: ModalComponent;
	@ViewChild("dropzone") dropzone: DropZoneComponent;

	private error:string = "";


	constructor(private router: Router,
				private sessServ: SessionService,
				private transcrServ: TranscriptionService) {
	}

	get sessionfile(): SessionFile {
		return this.sessServ.sessionfile;
	}

	ngOnInit() {
	}

	private navigate() {
		this.router.navigate([ 'user' ]);
	}

	//TODO A module for dropzone!
	getDropzoneFileString(file: File | SessionFile) {
		let fsize: FileSize = Functions.getFileSize(file.size);
		return Functions.buildStr("{0} ({1} {2})", [ file.name, (Math.round(fsize.size * 100) / 100), fsize.label ]);
	}

	abortTranscription() {
		this.router.navigate([ '/logout' ]);
	}

	onNewTranscription() {
		this.sessServ.sessionfile = this.getSessionFile(this.dropzone.file);
		this.sessServ.file = this.dropzone.file;

		this.sessServ.transcription = [];
		this.transcrServ.segments = null;

		this.sessServ.offline = true;
		this.navigate();
	}

	onOfflineSubmit = () => {
		let type: string = (this.sessServ.sessionfile.type) ? this.sessServ.sessionfile.type : "unbekannt";

		if (this.dropzone.file != null && this.sessServ.sessionfile != null && (type == "audio/wav" || type == "audio/x-wav")) {
			if (
				this.dropzone.file.name != this.sessServ.sessionfile.name
				|| this.dropzone.file.type != this.sessServ.sessionfile.type
				|| this.dropzone.file.size != this.sessServ.sessionfile.size
			) {
				this.showErrorMessage("Es wurde eine andere Datei ausgewählt. Bitte wähle die gleiche Datei aus wie zuvor oder beginne eine neue Transkription.\n\nGesucht wird die Datei '" + this.getDropzoneFileString(this.sessServ.sessionfile) + "'");
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
			this.showErrorMessage("Die Datei ist vom Typ '" + type + "' und wird nicht unterstützt.");
		}
	};

	private showErrorMessage(err:string){
		this.error = err;
		this.modal_error.open();
	}


	getSessionFile(file: File) {
		return new SessionFile(
			file.name,
			file.size,
			file.lastModifiedDate,
			file.type
		);
	}

	getFileStatus(): string {
		if (!isNullOrUndefined(this.dropzone.file) && (this.dropzone.file.type == "audio/wav" || this.dropzone.file.type == "audio/x-wav")) {
			//check conditions
			if (this.sessServ.sessionfile == null || this.dropzone.file.name == this.sessServ.sessionfile.name) {
				return "start";
			} else{
				return "new";
			}
		}

		return "unknown";
	}
}
