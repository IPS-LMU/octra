import { Component, OnInit, ViewChild, Output } from '@angular/core';
import { SessionService } from "../../service/session.service";
import { SessionFile } from "../../shared/SessionFile";
import { FileSize, Functions } from "../../shared/Functions";
import { Logger } from "../../shared/Logger";
import { NgForm } from "@angular/forms";
import { Router } from "@angular/router";
import { ModalComponent } from "ng2-bs3-modal/components/modal";
import { TranscriptionService } from "../../service/transcription.service";

@Component({
	selector   : 'app-reload-file',
	templateUrl: './reload-file.component.html',
	styleUrls  : [ './reload-file.component.css' ]
})
export class ReloadFileComponent implements OnInit {
	@ViewChild("modal_leave") modal_leave: ModalComponent;
	@ViewChild("modal_delete") modal_delete: ModalComponent;
	@ViewChild("modal_error") modal_error: ModalComponent;

	@Output() private selected_file: SessionFile;

	private error:string = "";

	private file: File;

	constructor(private router: Router,
				private sessServ: SessionService,
				private transcrServ: TranscriptionService) {
	}

	get sessionfile(): File {
		return this.sessServ.file;
	}

	ngOnInit() {
	}

	private navigate() {
		this.router.navigate([ 'user' ]);
	}

	//TODO A module for dropzone!
	getDropzoneFileString(file: SessionFile) {
		let fsize: FileSize = Functions.getFileSize(file.size);
		console.log(file.name);
		return Functions.buildStr("{0} ({1} {2})", [ file.name, (Math.round(fsize.size * 100) / 100), fsize.label ]);
	}

	abortTranscription() {
		this.router.navigate([ '/logout' ]);
	}

	onNewTranscription() {
		this.sessServ.selectedfile = this.selected_file;
		this.sessServ.file = this.file;

		this.sessServ.transcription = [];
		this.transcrServ.segments = null;

		this.sessServ.offline = true;
		this.navigate();
	}

	onDragOver($event) {
		$event.stopPropagation();
		$event.preventDefault();
		Logger.log("Drag");
		$event.dataTransfer.dropEffect = 'copy';
	}

	onFileDrop($event) {
		Logger.log("&Drop");
		$event.stopPropagation();
		$event.preventDefault();

		let files = $event.dataTransfer.files; // FileList object.

		if (files.length < 1) {
			this.showErrorMessage("Etwas ist schiefgelaufen!");
		}
		else {
			//select the first file
			console.log("Name: " + files[ 0 ].name);
			this.file = files[ 0 ];
			this.selected_file = new SessionFile(files[ 0 ].name, files[ 0 ].size, files[ 0 ].timestamp, files[ 0 ].type);
		}
	}

	onOfflineSubmit = () => {
		let type: string = (this.sessServ.selectedfile.type) ? this.sessServ.selectedfile.type : "unbekannt";

		if (this.selected_file != null && this.sessServ.selectedfile != null && type == "audio/wav") {
			if (
				this.file.name != this.sessServ.selectedfile.name
				|| this.file.type != this.sessServ.selectedfile.type
				|| this.file.size != this.sessServ.selectedfile.size
			) {
				this.showErrorMessage("Es wurde eine andere Datei ausgewählt. Bitte wähle die gleiche Datei aus wie zuvor oder beginne eine neue Transkription.\n\nGesucht wird die Datei '" + this.getDropzoneFileString(this.sessServ.selectedfile) + "'");
			}
			else {
				//navigate
				this.sessServ.selectedfile = this.selected_file;
				this.sessServ.file = this.file;

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
}
