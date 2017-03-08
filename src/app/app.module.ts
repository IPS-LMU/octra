//angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule, JsonpModule, Http } from "@angular/http";
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';


//third-party
import { Ng2Bs3ModalModule } from "ng2-bs3-modal/ng2-bs3-modal";
import { Ng2Webstorage } from 'ng2-webstorage';


//other
import {
	AudioNavigationComponent,
	AudioplayerComponent,
	AudioplayerDirective,
	AudioviewerComponent,
	AudioviewerConfig,
	AudioviewerDirective,
	LoupeComponent,
	TranscrEditorComponent,
	CircleLoupeComponent,
	AlertComponent,
	DropZoneComponent
} from "./component";
import {
	AudioplayerGUIComponent,
	LoadingComponent,
	LoginComponent,
	LogoutComponent,
	MembersAreaComponent,
	NavigationComponent,
	OverlayGUIComponent,
	ReloadFileComponent,
	SignalGUIComponent,
	TranscriptionComponent,
	TranscriptionSubmitComponent,
	TranscriptionSubmittedComponent,
	TranscrOverviewComponent,
	TranscrWindowComponent
} from "./gui";

import { routing } from "./app.routes";
import { TimespanPipe, ProcentPipe, SecondsPipe, LeadingNullPipe } from "./pipe";

import { APIService, NavbarService, AudioService, DialogService, KeymappingService, SessionService } from "./service";

import { DeALoginGuard, LogoutGuard, MembersAreaGuard, TranscrSubmittedGuard, ALoginGuard } from "./guard";

import { AppComponent } from "./app.component";
import { SettingsService } from "./service/settings.service";
import { SettingsGuard } from "./guard/settings.activateguard";

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
	return new TranslateHttpLoader(http, "assets/i18n/", ".json");
}

@NgModule({
	declarations: [
		AppComponent,
		AudioNavigationComponent,
		AudioplayerComponent,
		AudioplayerDirective,
		AudioplayerGUIComponent,
		AudioviewerComponent,
		AudioviewerDirective,
		CircleLoupeComponent,
		LoadingComponent,
		LoginComponent,
		LogoutComponent,
		LoupeComponent,
		MembersAreaComponent,
		NavigationComponent,
		OverlayGUIComponent,
		ProcentPipe,
		SecondsPipe,
		LeadingNullPipe,
		SignalGUIComponent,
		TimespanPipe,
		TranscrEditorComponent,
		TranscriptionComponent,
		TranscriptionSubmitComponent,
		TranscriptionSubmittedComponent,
		TranscrOverviewComponent,
		TranscrWindowComponent,
		AlertComponent,
		ReloadFileComponent,
		DropZoneComponent
	],
	imports     : [
		BrowserModule,
		TranslateModule.forRoot({
			loader: {
				provide   : TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps      : [ Http ]
			}
		}),
		FormsModule,
		HttpModule,
		JsonpModule,
		Ng2Webstorage,
		Ng2Bs3ModalModule,
		ReactiveFormsModule,
		routing
	],
	bootstrap   : [
		AppComponent
	],
	providers   : [
		ALoginGuard,
		AudioService,
		AudioviewerConfig,
		APIService,
		DeALoginGuard,
		DialogService,
		KeymappingService,
		LogoutGuard,
		MembersAreaGuard,
		SettingsGuard,
		SessionService,
		TranscrSubmittedGuard,
		TranslateService,
		NavbarService,
		SettingsService
	]
})

export class AppModule {
}
