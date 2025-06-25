import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgbToast, NgbToastHeader } from '@ng-bootstrap/ng-bootstrap';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { swingAnimation } from 'angular-animations';
import { interval } from 'rxjs';
import { VersionCheckerService } from '../version-checker.service';

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
  protected readonly versionCheckerService = inject(VersionCheckerService);
  protected readonly sanitizer = inject(DomSanitizer);

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
    reload: '<i class="bi bi-arrow-clockwise" style="color: white;"></i>',
  };

  @ViewChild('toast', { static: true }) toast: NgbToast;

  preparedI18n: {
    'reload now': SafeHtml;
    later: SafeHtml;
    'new update': {
      header: SafeHtml;
      body: SafeHtml;
    };
  };

  preparedIcons: {
    reload: SafeHtml;
    'new update': SafeHtml;
  };

  constructor() {
    super();
    this.prepareI18n(this.i18n);
    this.prepareIcons(this.icons);
  }

  prepareI18n(i18n: any) {
    this.preparedI18n = {
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

  prepareIcons(icons: any) {
    this.preparedIcons = {
      reload: this.sanitizer.bypassSecurityTrustHtml(icons['reload']),
      'new update': this.sanitizer.bypassSecurityTrustHtml(icons['new update']),
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

    const icons = changes['icons'];
    if (icons?.currentValue) {
      this.prepareIcons(icons.currentValue);
    }
  }
  close() {
    this.toast.hide();
  }
}
