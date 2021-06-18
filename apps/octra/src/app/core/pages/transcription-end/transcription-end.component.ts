import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {NavbarService} from '../../component/navbar/navbar.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'octra-transcription-submitted',
  templateUrl: './transcription-end.component.html',
  styleUrls: ['./transcription-end.component.css']
})
export class TranscriptionEndComponent implements OnInit, OnDestroy {
  private subscrmanager: SubscriptionManager<Subscription>;

  constructor(private router: Router,
              private appStorage: AppStorageService,
              private tranService: TranscriptionService,
              private uiService: UserInteractionsService,
              private settService: SettingsService,
              private navService: NavbarService) {

    this.subscrmanager = new SubscriptionManager<Subscription>();
    this.navService.showInterfaces = false;
    this.navService.showExport = false;
    this.navService.dataloaded = false;
  }

  ngOnInit() {
    this.appStorage.submitted = true;
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  leave() {
    this.tranService.endTranscription();

    this.uiService.elements = [];
    this.appStorage.logout(true);
  }
}
