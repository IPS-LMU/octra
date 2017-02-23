//angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule, JsonpModule } from "@angular/http";


//third-party
import { Ng2Bs3ModalModule } from "ng2-bs3-modal/ng2-bs3-modal";
import { Ng2Webstorage } from 'ng2-webstorage';


//other
import {
	AudioCanvasDirective,
	AudioviewerComponent,
	AudioviewerConfig,
	AudioviewerDirective
} from "./component/audioviewer";
import {
	AudioNavigationComponent,
	AudioplayerComponent,
	AudioplayerConfig,
	AudioplayerDirective,
	LoupeComponent,
	TranscrEditorComponent
} from "./component";
import {
	AudioplayerGUIComponent,
	LoadingComponent,
	LoginComponent,
	LogoutComponent,
	MembersAreaComponent,
	NavigationComponent,
	OverlayGUIComponent,
	SignalGUIComponent,
	TranscriptionComponent,
	TranscriptionSubmitComponent,
	TranscriptionSubmittedComponent,
	TranscrOverviewComponent,
	TranscrWindowComponent
} from "./gui";
import { routing } from "./app.routes";
import { TimespanPipe, ProcentPipe, SecondsPipe, LeadingNullPipe } from "./pipe";
import { AudioService, DialogService, KeymappingService, SessionService, } from "./service";
import { CircleLoupeComponent } from "./component/circleloupe";
import { DeALoginGuard, LogoutGuard, MembersAreaGuard } from "./guard";
import { TranscrEditorConfig } from "./component/transcr-editor";
import { ALoginGuard, TranscrSubmittedGuard } from "./guard";
import { AppComponent } from "./app.component";
import { AlertComponent } from './component/alert/alert.component';
import { APIService } from "./service/api.service";
import { ReloadFileComponent } from './gui/reload-file/reload-file.component';
import { NavbarService } from "./service/navbar.service";

@NgModule({
	declarations: [
		AppComponent,
		AudioCanvasDirective,
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
		ReloadFileComponent
	],
	imports     : [
		BrowserModule,
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
		SessionService,
		TranscrSubmittedGuard,
		NavbarService
	]
})

export class AppModule {
}
