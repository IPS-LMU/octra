import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {UserInteractionsService} from '../../shared/service/userInteractions.service';
import {SubscriptionManager} from '../../shared';
import {SettingsService} from '../../shared/service/settings.service';
import {NavbarService} from '../navbar/navbar.service';


@Component({
  selector: 'app-transcription-submitted',
  templateUrl: './transcription-end.component.html',
  styleUrls: ['./transcription-end.component.css']
})
export class TranscriptionEndComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscrmanager: SubscriptionManager;

  constructor(private router: Router,
              private sessService: AppStorageService,
              private tranService: TranscriptionService,
              private uiService: UserInteractionsService,
              private settService: SettingsService,
              private navService: NavbarService) {

    this.subscrmanager = new SubscriptionManager();
    this.navService.show_interfaces = false;
    this.navService.show_export = false;
    this.navService.dataloaded = false;
  }

  ngOnInit() {
    this.sessService.submitted = true;
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  leave() {
    this.tranService.endTranscription();

    this.clearData();
    this.sessService.clearLocalStorage();

    this.router.navigate(['/logout']);
  }

  clearData() {
    this.sessService.submitted = false;
    this.sessService.clearAnnotationData().catch((err) => {
      console.error(err)
    });

    this.sessService.idb.save('options', 'feedback', {value: null}).catch((err) => {
      console.error(err);
    });
    this.sessService.comment = '';
    this.sessService.clearLoggingData().catch((err) => {
      console.error(err)
    });
    this.uiService.elements = [];
    this.settService.clearSettings();
  }
}
