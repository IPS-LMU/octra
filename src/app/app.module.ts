//angular
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule, JsonpModule, Http } from "@angular/http";


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
import { DropZoneComponent } from './component/drop-zone/drop-zone.component';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: Http) {
	return new TranslateHttpLoader(http,"assets/i18n/", ".json");
}

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
		ReloadFileComponent,
		DropZoneComponent
	],
	imports     : [
		BrowserModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: HttpLoaderFactory,
				deps: [Http]
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
		SessionService,
		TranscrSubmittedGuard,
		TranslateService,
		NavbarService
	]
})

export class AppModule {
}
