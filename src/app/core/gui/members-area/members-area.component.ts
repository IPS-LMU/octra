import {Component, OnDestroy, OnInit} from '@angular/core';
import {SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {Router} from '@angular/router';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AsrService} from '../../shared/service/asr.service';

@Component({
  selector: 'app-members-area',
  templateUrl: './members-area.component.html',
  styleUrls: ['./members-area.component.css'],
  providers: [UserInteractionsService, TranscriptionService, AsrService]
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
