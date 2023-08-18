import { Component, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';
import { interval, Subscription } from 'rxjs';
import { DynComponentDirective } from '../../shared/directive/dyn-component.directive';
import { AlertEntry, AlertService } from '../../shared/service/alert.service';
import { DefaultComponent } from '../default.component';

@Component({
  selector: 'octra-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
})
export class AlertComponent extends DefaultComponent {
  constructor(public alertService: AlertService) {
    super();
  }
}
