import {Component, ElementRef, OnDestroy, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-about-modal',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.css']
})
export class AboutModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  public visible = false;

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public bibtexCiteURL?: SafeResourceUrl;

  public get AppInfo() {
    return AppInfo;
  }

  constructor(private sanitizer: DomSanitizer) {

    const bibtex = new File([`@INPROCEEDINGS{peomp2017octra
title={OCTRA--a Configurable Browser-Based Editor for Orthographic Transcription},
author={P{\\"o}mp, Julian and Draxler, Christoph},
booktitle={Proceedings of Phonetik und Phonologie im deutschsprachigen Raum (P\\&P)},
year={2017},
address={Berlin},
pages={145--148}
}`], 'octra-2017.bib', {type: 'text/plain'});

    this.bibtexCiteURL = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(bibtex));
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal);
      this.visible = true;

      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );

    });
  }

  public close() {
    this.modal.hide();

    this.actionperformed.next();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.visible = false;
    this.subscrmanager.destroy();
  }
}
