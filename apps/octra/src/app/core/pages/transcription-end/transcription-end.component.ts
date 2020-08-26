import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Functions, SubscriptionManager} from '@octra/utilities';
import {AppInfo} from '../../../app.info';
import {SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {NavbarService} from '../../component/navbar/navbar.service';

@Component({
  selector: 'octra-transcription-submitted',
  templateUrl: './transcription-end.component.html',
  styleUrls: ['./transcription-end.component.css']
})
export class TranscriptionEndComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscrmanager: SubscriptionManager;

  constructor(private router: Router,
              private appStorage: AppStorageService,
              private tranService: TranscriptionService,
              private uiService: UserInteractionsService,
              private settService: SettingsService,
              private navService: NavbarService) {

    this.subscrmanager = new SubscriptionManager();
    this.navService.showInterfaces = false;
    this.navService.showExport = false;
    this.navService.dataloaded = false;
  }

  ngOnInit() {
    this.appStorage.submitted = true;
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  leave() {
    this.tranService.endTranscription();

    this.clearData();
    this.appStorage.clearLocalStorage();

    Functions.navigateTo(this.router, ['/logout'], AppInfo.queryParamsHandling).catch((error) => {
      console.error(error);
    });
  }

  clearData() {
    this.appStorage.submitted = false;
    this.appStorage.clearAnnotation();
    this.appStorage.comment = '';
    this.appStorage.clearLoggingData();
    this.uiService.elements = [];
    this.settService.clearSettings();
  }
}
