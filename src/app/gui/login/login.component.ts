import {
	Component,
	OnInit,
	ViewChild,
	OnDestroy,
	ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { NgForm} from '@angular/forms';
import { LoginService } from "../../service/login.service";
import { SessionService } from "../../service/session.service";
import { ComponentCanDeactivate } from "../../guard/login.deactivateguard";
import { Observable} from "rxjs/Rx";
import { Functions, FileSize } from "../../shared/Functions";
import { APIService } from "../../service/api.service";
import { BrowserCheck } from "../../shared/BrowserCheck";
import { HostListener } from "@angular/core/src/metadata/directives";
import { SessionFile } from "../../shared/SessionFile";
import { OCTRANIMATIONS } from "../../shared/OCTRAnimations";
import { DropZoneComponent } from "../../component/drop-zone/drop-zone.component";
import { isNullOrUndefined } from "util";
import { SubscriptionManager } from "../../shared";
import { Http } from "@angular/http";
import { SettingsService } from "../../service/settings.service";
import { ModalService } from "../../service/modal.service";

@Component({
	selector   : 'app-login',
	templateUrl: 'login.component.html',
	styleUrls  : [ 'login.component.css' ],
	providers  : [ LoginService ],
	animations : OCTRANIMATIONS
})
export class LoginComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
	@ViewChild('f') loginform: NgForm;
	@ViewChild('dropzone') dropzone: DropZoneComponent;

	private valid_platform: boolean = false;
	private valid_size: boolean = false;
	private browser_check: BrowserCheck;
	private agreement_checked: boolean;

	private subscrmanager: SubscriptionManager;

	get sessionfile(): SessionFile {
		return this.sessionService.sessionfile;
	}

	get apc(): any {
		return this.settingsService.app_settings;
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
				private cd: ChangeDetectorRef,
				private http:Http,
				private settingsService:SettingsService,
				private modService:ModalService
	) {
		this.subscrmanager = new SubscriptionManager();
		this.subscrmanager.add(this.modService.newtranscriptionclick.subscribe(
			()=>{
				this.newTranscription();
			}
		));
	}

	ngOnInit() {
		this.browser_check = new BrowserCheck();
		this.valid_platform = true;
		this.agreement_checked = true;
		if(this.apc.octra.allowed_browsers.length > 0)
			this.valid_platform = this.browser_check.isValidBrowser(this.apc.octra.allowed_browsers);
		else
			this.valid_platform = true;

		if(this.apc.octra.responsive.enabled == false)
			this.valid_size = window.innerWidth >= this.apc.octra.responsive.fixedwidth;
		else
			this.valid_size = true;

		jQuery.material.init();

		this.cd.markForCheck();
		this.cd.detectChanges();
	}

	ngAfterViewInit() {
	}

	ngOnDestroy() {
		this.subscrmanager.destroy();
	}

	onSubmit(form: NgForm) {
		this.subscrmanager.add(this.api.beginSession("transcription", "", Number(this.member.id), "").catch((error) => {
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
					this.modService.show("login_invalid");
				}
			}
		));
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
		if(this.apc.octra.responsive.enabled == false)
			this.valid_size = window.innerWidth >= this.apc.octra.responsive.fixedwidth;
		else
			this.valid_size = true;
	}

	openAgreement() {
		//this.agreement.open();
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
			}
			else {
				return "new";
			}
		}

		return "unknown";
	}

	getValidBrowsers():string{
		let result = "";

		for(let i = 0; i < this.apc.octra.allowed_browsers.length; i++){
			let browser = this.apc.octra.allowed_browsers[i];
			result += browser.name + "("+ browser.version +")";
		}

		return result;
	}
}
