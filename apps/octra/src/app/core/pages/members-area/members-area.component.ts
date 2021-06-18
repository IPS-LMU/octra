import {Component, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AsrService} from '../../shared/service/asr.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'octra-members-area',
  templateUrl: './members-area.component.html',
  styleUrls: ['./members-area.component.css'],
  providers: [UserInteractionsService, TranscriptionService, AsrService]
})
export class MembersAreaComponent implements OnDestroy {

  subscrmanager: SubscriptionManager<Subscription> = new SubscriptionManager<Subscription>();

  constructor(private router: Router,
              private settService: SettingsService) {
    document.body.setAttribute('style', 'overflow:hidden');
  }

  ngOnDestroy() {
    document.body.removeAttribute('style');
  }
}
