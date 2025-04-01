import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgbToast, NgbToastHeader } from '@ng-bootstrap/ng-bootstrap';
import { VersionCheckerService } from '@octra/ngx-components';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { swingAnimation } from 'angular-animations';
import { interval } from 'rxjs';

@Component({
  standalone: true,
  selector: 'octra-version-notification',
  templateUrl: './version-notification.component.html',
  styleUrls: ['./version-notification.component.scss'],
  animations: [swingAnimation()],
  imports: [NgbToastHeader, NgbToast],
})
export class VersionNotificationComponent
  extends SubscriberComponent
  implements OnInit, OnChanges
{
  swingBell = false;

  @Input() i18n = {
    'reload now': 'Reload now',
    later: 'Later',
    'new update': {
      header: 'New update available!',
      body: 'Please reload this app as soon as possible. Make sure you saved your on-going work before reloading.',
    },
  };

  @Input() icons = {
    'new update': '<i class="bi bi-bell-fill" style="color: #ffca00;"></i>',
    reload:
      '<i class="bi bi-arrow-clockwise" style="color: cornflowerblue;"></i>',
  };

  @ViewChild('toast', { static: true }) toast: NgbToast;

  labels: {
    'reload now': SafeHtml;
    later: SafeHtml;
    'new update': {
      header: SafeHtml;
      body: SafeHtml;
    };
  };

  constructor(
    protected readonly versionCheckerService: VersionCheckerService,
    protected readonly sanitizer: DomSanitizer,
  ) {
    super();
  }

  prepareI18n(i18n: any) {
    this.labels = {
      'reload now': i18n['reload now'],
      later: i18n['later'],
      'new update': {
        header: this.sanitizer.bypassSecurityTrustHtml(
          i18n['new update'].header,
        ),
        body: this.sanitizer.bypassSecurityTrustHtml(i18n['new update'].body),
      },
    };
  }

  ngOnInit() {
    this.subscribe(interval(2000), {
      next: () => {
        this.swingBell = !this.swingBell;
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const i18n = changes['i18n'];
    if (i18n?.currentValue) {
      this.prepareI18n(i18n.currentValue);
    }
  }
  close() {
    this.toast.hide();
  }
}
