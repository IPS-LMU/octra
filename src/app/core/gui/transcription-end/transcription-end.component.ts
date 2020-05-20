import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AppInfo} from '../../../app.info';
import {SubscriptionManager} from '../../shared';
import {Functions} from '../../shared/Functions';
import {AppStorageService, SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {NavbarService} from '../navbar/navbar.service';

@Component({
  selector: 'app-transcription-submitted',
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

    Functions.navigateTo(this.router, ['/logout'], AppInfo.queryParamsHandling);
  }

  clearData() {
    this.appStorage.submitted = false;
    this.appStorage.clearAnnotationData().catch((err) => {
      console.error(err);
    });

    this.appStorage.idb.save('options', 'feedback', {value: null}).catch((err) => {
      console.error(err);
    });
    this.appStorage.comment = '';
    this.appStorage.clearLoggingData().catch((err) => {
      console.error(err);
    });
    this.uiService.elements = [];
    this.settService.clearSettings();
  }
}
