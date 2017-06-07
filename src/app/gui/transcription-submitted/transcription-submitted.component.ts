import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {SessionService} from '../../service/session.service';
import {TranscriptionService} from '../../service/transcription.service';
import {UserInteractionsService} from '../../service/userInteractions.service';
import {APIService} from '../../service/api.service';
import {ModalComponent} from 'ng2-bs3-modal/components/modal';
import {AudioService} from '../../service/audio.service';
import {SubscriptionManager} from '../../shared';
import {isArray, isNumber} from 'util';
import {SettingsService} from '../../service/settings.service';
import {NavbarService} from '../../service/navbar.service';


@Component({
  selector: 'app-transcription-submitted',
  templateUrl: './transcription-submitted.component.html',
  styleUrls: ['./transcription-submitted.component.css']
})
export class TranscriptionSubmittedComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('success') success_modal: ModalComponent;

  private subscrmanager: SubscriptionManager;

  private navigation: any;

  constructor(private router: Router,
              private sessService: SessionService,
              private tranService: TranscriptionService,
              private uiService: UserInteractionsService,
              private api: APIService,
              private audio: AudioService,
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

  next() {
    this.tranService.endTranscription(false);
    this.clearData();
    this.subscrmanager.add(this.api.beginSession(this.sessService.member_project, this.sessService.member_id,
      Number(this.sessService.member_jobno), '')
      .subscribe((result) => {
        if (result !== null) {
          const json = result.json();

          if (json.data && json.data.hasOwnProperty('url') && json.data.hasOwnProperty('id')) {
            this.sessService.audio_url = json.data.url;
            this.sessService.data_id = json.data.id;

            // get transcript data that already exists
            if (json.data.hasOwnProperty('transcript')) {
              const transcript = JSON.parse(json.data.transcript);

              if (isArray(transcript) && transcript.length > 0) {
                this.sessService.servertranscipt = transcript;
              }
            }

            if (json.hasOwnProperty('message') && isNumber(json.message)) {
              this.sessService.jobs_left = Number(json.message);
            }

            this.router.navigate(['/user/load']);
          } else {
            this.openSuccessModal();
          }
        }
      }));
  }

  openSuccessModal() {
    this.success_modal.open();
  }

  clearData() {
    this.sessService.submitted = false;
    this.sessService.annotation = null;

    this.sessService.feedback = null;
    this.sessService.comment = '';
    this.sessService.logs = [];
    this.uiService.elements = [];
    this.settService.clearSettings();
  }
}
