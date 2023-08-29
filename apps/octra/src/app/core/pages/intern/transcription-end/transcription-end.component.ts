import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { navigateTo } from '@octra/ngx-utilities';
import { UserInteractionsService } from '../../../shared/service';
import { AppStorageService } from '../../../shared/service/appstorage.service';
import { NavbarService } from '../../../component/navbar/navbar.service';
import { DefaultComponent } from '../../../component/default.component';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';

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
    private annotationStoreService: AnnotationStoreService,
    private uiService: UserInteractionsService,
    private navService: NavbarService
  ) {
    super();
    this.navService.showInterfaces = false;
    this.navService.showExport = false;
    this.navService.dataloaded = false;
  }

  ngOnInit() {}

  leave() {
    this.annotationStoreService.endTranscription();

    this.uiService.elements = [];
    this.appStorage.logout(true);
  }

  backToProjectsList() {
    navigateTo(this.router, ['intern/projects']);
  }
}
