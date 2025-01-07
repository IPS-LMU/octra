import { NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';
import { AlertService } from '../../shared/service/alert.service';
import { DefaultComponent } from '../default.component';

@Component({
  selector: 'octra-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
  imports: [NgbToast, NgClass],
})
export class AlertComponent extends DefaultComponent {
  constructor(public alertService: AlertService) {
    super();
  }
}
