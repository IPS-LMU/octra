import { NgClass } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslocoPipe } from '@jsverse/transloco';
import { AlertService } from '../../shared/service/alert.service';
import { DefaultComponent } from '../default.component';

@Component({
  selector: 'octra-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NgbToast, NgClass, TranslocoPipe],
})
export class AlertComponent extends DefaultComponent {
  alertService = inject(AlertService);
}
