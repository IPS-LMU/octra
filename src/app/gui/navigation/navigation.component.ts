import { Component, OnInit, Input, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from "rxjs/Rx";
import { SessionService } from "../../service/session.service";
import { ModalComponent } from "ng2-bs3-modal/components/modal";
import { TranscriptionService } from "../../service/transcription.service";
import { TextConverter } from "../../shared/Converters/TextConverter";
import { NavbarService } from "../../service/navbar.service";
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from "@ngx-translate/core";

@Component({
	selector   : 'app-navigation',
	templateUrl: 'navigation.component.html',
	styleUrls  : [ 'navigation.component.css' ]
})

export class NavigationComponent implements OnInit, OnDestroy, AfterViewInit {

	@ViewChild("modalexport") modalexport: ModalComponent;
	@Input('version') version: string;

	public test: string = "ok";
	collapsed: boolean = false;

	constructor(private sessService: SessionService,
				private navbarServ: NavbarService,
				private sanitizer: DomSanitizer,
				private langService:TranslateService) {
	}

	ngOnDestroy() {
	}

	ngOnInit() {
	}

	ngAfterViewInit() {
		(($) => {
			$(() => {
			}); // end of document ready
		})(jQuery); // end of jQuery name space
	}

	coll() {
		if (this.collapsed) {
			(($) => {
				$(() => {
					$('.navbar-header').find("button").click();
				}); // end of document ready
			})(jQuery); // end of jQuery name space
		}
	}

	setInterface(new_interface: string) {
		this.sessService.Interface = new_interface;

	}

	onNavBarLeave($event) {
		$event.target.click();
	}

	getTextFile() {
		let txt = "";
		/*
		 let data = this.tranServ.exportDataToJSON();

		 let tc:TextConverter = new TextConverter();
		 txt = tc.convert(data);

		 alert(txt);*/
	}

	getURI(format: string): string {
		let result: string = "";

		switch (format) {
			case("text"):
				result += "data:text/plain;charset=UTF-8,";
				result += encodeURIComponent(this.navbarServ.exportformats.text);
				break;
			case("annotJSON"):
				result += "data:application/json;charset=UTF-8,";
				result += encodeURIComponent(this.navbarServ.exportformats.annotJSON);
				break;
		}

		return result;
	}

	sanitize(url:string){
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	changeLanguage(lang:string){
		this.langService.setDefaultLang(lang);
		console.log("change to lang: " + lang);
	}

}
