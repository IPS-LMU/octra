import {Component, OnDestroy, OnInit} from '@angular/core';
import {UserInteractionsService} from '../../shared/service/userInteractions.service';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {Router} from '@angular/router';
import {SettingsService} from '../../shared/service/settings.service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';

@Component({
  selector: 'app-members-area',
  templateUrl: './members-area.component.html',
  styleUrls: ['./members-area.component.css'],
  providers: [UserInteractionsService, TranscriptionService]
})
export class MembersAreaComponent implements OnInit, OnDestroy {

  subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(private router: Router,
              private settService: SettingsService) {
    document.body.setAttribute('style', 'overflow:hidden');
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    document.body.removeAttribute('style');
  }
}
