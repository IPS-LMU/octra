import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-help-modal',
  templateUrl: './help-modal.component.html',
  styleUrls: ['./help-modal.component.scss']
})
export class HelpModalComponent extends OctraModal implements OnDestroy {
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  private subscrManager = new SubscriptionManager<Subscription>();

  constructor(modalRef: MDBModalRef, modalService: MDBModalService) {
    super('HelpModalComponent');
    this.init(modalService, modalRef);
  }

  ngOnDestroy() {
    this.subscrManager.destroy();
  }
}
