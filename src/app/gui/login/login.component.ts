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
import { APP_CONFIG } from "../../app.config";
import { DropZoneComponent } from "../../component/drop-zone/drop-zone.component";
import { isNullOrUndefined } from "util";
import { isUndefined } from "util";

@Component({
	selector   : 'app-login',
	templateUrl: 'login.component.html',
	styleUrls  : [ 'login.component.css' ],
	providers  : [ LoginService ],
	animations : OCTRANIMATIONS
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
	@ViewChild('modal') modal: ModalComponent;
	@ViewChild('agreement') agreement: ModalComponent;
	@ViewChild('f') loginform: NgForm;
	@ViewChild('dropzone') dropzone: DropZoneComponent;

	private valid_platform: boolean = false;
	private valid_size: boolean = false;
	private browser_check: BrowserCheck;
	private agreement_checked: boolean;

	private subscriptions: Subscription[] = [];

	get sessionfile():SessionFile{
		return this.sessionService.sessionfile;
	}

	get apc(): any {
		return APP_CONFIG.Settings;
	}

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

		this.cd.markForCheck();
		this.cd.detectChanges();
	}

	ngAfterViewInit() {
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

		let type: string = (this.dropzone.file.type) ? this.dropzone.file.type : "unknown";

		if (this.dropzone.file != null && type == "audio/x-wav" || type == "audio/wav") {

			let res = this.sessionService.setSessionData("0", 0, "");
			if (res.error === "") {
				this.sessionService.offline = true;
				this.sessionService.sessionfile = new SessionFile(
					this.dropzone.file.name,
					this.dropzone.file.size,
					this.dropzone.file.lastModifiedDate,
					this.dropzone.file.type
				);

				this.sessionService.file = this.dropzone.file;
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

	afterFileDrop($event) {
	}

	getDropzoneFileString(file: File| SessionFile) {
		let fsize: FileSize = Functions.getFileSize(file.size);
		return Functions.buildStr("{0} ({1} {2})", [ file.name, (Math.round(fsize.size * 100) / 100), fsize.label ]);
	}

	newTranscription() {
		if (this.dropzone.file != null) {
			this.sessionService.clearSession();
			this.sessionService.clearLocalStorage();
			this.sessionService.setSessionData("", 0, "");
			this.sessionService.sessionfile = this.getSessionFile(this.dropzone.file);
			this.sessionService.file = this.dropzone.file;
			this.sessionService.offline = true;
			this.navigate();
		}
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
			if (this.sessionService.sessionfile == null || this.dropzone.file.name == this.sessionService.sessionfile.name) {
				return "start";
			} else{
				return "new";
			}
		}

		return "unknown";
	}
}
