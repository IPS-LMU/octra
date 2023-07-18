import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { navigateTo } from '@octra/ngx-utilities';
import {
  SettingsService,
  TranscriptionService,
  UserInteractionsService,
} from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { NavbarService } from '../../../component/navbar/navbar.service';
import { DefaultComponent } from '../../../component/default.component';

@Component({
  selector: 'octra-transcription-submitted',
  templateUrl: './transcription-end.component.html',
  styleUrls: ['./transcription-end.component.scss'],
})
export class TranscriptionEndComponent
  extends DefaultComponent
  implements OnInit
{
  constructor(
    private router: Router,
    private appStorage: AppStorageService,
    private tranService: TranscriptionService,
    private uiService: UserInteractionsService,
    private settService: SettingsService,
    private navService: NavbarService
  ) {
    super();
    this.navService.showInterfaces = false;
    this.navService.showExport = false;
    this.navService.dataloaded = false;
  }

  ngOnInit() {
  }

  leave() {
    this.tranService.endTranscription();

    this.uiService.elements = [];
    this.appStorage.logout(true);
  }

  backToProjectsList() {
    navigateTo(this.router, ['intern/projects']);
  }
}
