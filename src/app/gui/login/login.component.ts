import {
	Component,
	Input,
	trigger,
	state,
	style,
	transition,
	animate,
	OnInit,
	ViewChild,
	OnDestroy,
	ElementRef,
	Output,
	ChangeDetectionStrategy,
	ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { NgForm, FormGroup, Form } from '@angular/forms';
import { LoginService } from "../../service/login.service";
import { SessionService } from "../../service/session.service";
import { ComponentCanDeactivate } from "../../guard/login.deactivateguard";
import { Observable, Subscription } from "rxjs/Rx";
import { ModalComponent } from 'ng2-bs3-modal/ng2-bs3-modal';
import { Functions, FileSize } from "../../shared/Functions";
import { APIService } from "../../service/api.service";
import { BrowserCheck } from "../../shared/BrowserCheck";
import { HostListener } from "@angular/core/src/metadata/directives";
import { Logger } from "../../shared/Logger";
import { SessionFile } from "../../shared/SessionFile";
import { OCTRANIMATIONS } from "../../shared/OCTRAnimations";

@Component({
	selector       : 'app-login',
	templateUrl    : 'login.component.html',
	styleUrls      : [ 'login.component.css' ],
	providers      : [ LoginService ],
	animations: OCTRANIMATIONS
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
	@ViewChild('modal') modal: ModalComponent;
	@ViewChild('agreement') agreement: ModalComponent;
	@ViewChild('dropzone') dropzoneRef: ElementRef;
	@ViewChild('f') loginform: NgForm;

	private valid_platform: boolean = false;
	private valid_size: boolean = false;
	private browser_check: BrowserCheck;
	private agreement_checked: boolean;

	private dropzone: HTMLDivElement;

	private subscriptions: Subscription[] = [];

	private sessionfile: SessionFile;

	private file:File;

	close() {
		this.modal.close();
	}

	open() {
		this.modal.open();
	}

	valid = false;

	member = {
		id       : "",
		agreement: ""
	};

	err: string = "";

	local_state = "inactive";

	constructor(private router: Router,
				private loginService: LoginService,
				private sessionService: SessionService,
				private api: APIService,
				private cd: ChangeDetectorRef) {
	}

	ngOnInit() {
		this.browser_check = new BrowserCheck();
		this.valid_platform = true;
		this.agreement_checked = true;
		//this.valid_platform = (this.browser_check.isValidBrowser());
		this.valid_size = true;
		//this.valid_size = this.browser_check.isValidWindowWidth();

		jQuery.material.init();

		console.log(this.sessionfile);
		this.cd.markForCheck();
		this.cd.detectChanges();
	}

	ngAfterViewInit() {
		this.dropzone = this.dropzoneRef.nativeElement;
		/*
		 Logger.log("view init");
		 this.dropzone.addEventListener('dragover', this.onDragOver, false);
		 this.dropzone.addEventListener('this.sessionService.selectedfiledrop', this.onFileDrop, false);*/
	}

	ngOnDestroy() {
		Functions.unsubscribeAll(this.subscriptions);
	}

	onSubmit(form: NgForm) {
		let subscr = this.api.beginSession("transcription", "", Number(this.member.id), "").catch((error) => {
			alert("Fehler beim Aufbau der Verbindung.");
			return Observable.throw(error);
		}).subscribe(
			(result) => {
				let json = result.json();
				if (form.valid && this.agreement_checked && this.loginService.checkLoginData(Number(this.member.id))
					&& json.message !== "0"
				) {
					let res = this.sessionService.setSessionData(this.member.id, json.data.id, json.data.url);
					if (res.error === "")
						this.navigate();
					else
						alert(res.error);
				}
				else {
					this.modal.open();
				}
			}
		);

		this.subscriptions.push(subscr);
	}

	onOfflineSubmit = (form: NgForm) => {
		if(this.sessionService.selectedfile == null)
			this.sessionService.selectedfile = this.sessionfile;

		let type: string = (this.sessionService.selectedfile.type) ? this.sessionService.selectedfile.type : "unbekannt";

		if (this.sessionService.selectedfile != null && type == "audio/x-wav" || type == "audio/wav") {
			//navigate
			let res = this.sessionService.setSessionData("0", 0, "");
			if (res.error === "") {
				this.sessionService.offline = true;
				this.sessionService.selectedfile = this.sessionfile;
				this.sessionService.file = this.file;
				this.navigate();
			}
			else {
				alert(res.error);
			}
		}
		else {
			alert("Die Datei ist vom Typ " + type + " und wird nicht unterstützt.");
		}
	};

	canDeactivate(): Observable<boolean> | boolean {
		return (this.valid && this.loginService.checkLoginData(Number(this.member.id)));
	}

	private navigate() {
		this.router.navigate([ 'user' ], {
			queryParams: {
				login: true
			}
		});
	}

	@HostListener('window:resize', [ '$event' ])
	onResize($event) {
		this.valid_size = this.browser_check.isValidWindowWidth();
	}

	openAgreement() {
		this.agreement.open();
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
			alert("Etwas ist schiefgelaufen!");
		}
		else {
			//select the first file
			this.sessionfile = new SessionFile(files[ 0 ].name, files[ 0 ].size, files[ 0 ].timestamp, files[ 0 ].type);
			this.file = files[ 0 ];
		}
	}

	getDropzoneFileString(file: SessionFile) {
		let fsize: FileSize = Functions.getFileSize(file.size);
		console.log(file.name);
		return Functions.buildStr("{0} ({1} {2})", [ file.name, (Math.round(fsize.size * 100) / 100), fsize.label ]);
	}

	toggleState(){
		this.local_state = (this.local_state == "active") ? "inactive" : "active";
	}

	newTranscription(){
		if(this.file != null) {
			this.sessionService.clearSession();
			this.sessionService.clearLocalStorage();
			this.sessionService.setSessionData("", 0, "");
			this.sessionService.selectedfile = this.sessionfile;
			this.sessionService.file = this.file;
			this.sessionService.offline = true;
			this.navigate();
		}
	}
}
