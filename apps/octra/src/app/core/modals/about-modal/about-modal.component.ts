import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { OctraAPIService } from '@octra/ngx-octra-api';
import { Subject } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-about-modal',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss'],
  imports: [TranslocoPipe],
})
export class AboutModalComponent extends OctraModal implements OnDestroy {
  public static options: NgbModalOptions = {
    size: 'xl',
    keyboard: false,
    backdrop: true,
  };
  public visible = false;
  legalsExist = false;
  legals: {
    label: string;
    url: string;
  }[] = [];

  @ViewChild('modal', { static: true }) modal: any;
  @ViewChild('content', { static: false }) contentElement?: ElementRef;

  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();

  public bibtexCiteURL?: SafeResourceUrl;

  public get AppInfo() {
    return AppInfo;
  }

  constructor(
    private sanitizer: DomSanitizer,
    private api: OctraAPIService,
    protected override activeModal: NgbActiveModal,
  ) {
    super('octraModal', activeModal);

    this.legalsExist =
      this.api.appProperties?.legals.imprint_url !== undefined &&
      this.api.appProperties?.legals.privacy_url !== undefined &&
      this.api.appProperties?.legals.tos_url !== undefined;

    if (this.api.appProperties?.legals?.imprint_url) {
      this.legals.push({
        label: 'imprint',
        url: this.api.appProperties?.legals?.imprint_url,
      });
    }

    if (this.api.appProperties?.legals?.privacy_url) {
      this.legals.push({
        label: 'privacy',
        url: this.api.appProperties?.legals?.privacy_url,
      });
    }

    if (this.api.appProperties?.legals?.tos_url) {
      this.legals.push({
        label: 'terms and conditions',
        url: this.api.appProperties?.legals?.tos_url,
      });
    }

    const bibtex = new File(
      [
        `@INPROCEEDINGS{peomp2017octra
title={OCTRA--a Configurable Browser-Based Editor for Orthographic Transcription},
author={P{\\"o}mp, Julian and Draxler, Christoph},
booktitle={Proceedings of Phonetik und Phonologie im deutschsprachigen Raum (P\\&P)},
year={2017},
address={Berlin},
pages={145--148}
}`,
      ],
      'octra-2017.bib',
      { type: 'text/plain' },
    );

    this.bibtexCiteURL = this.sanitizer.bypassSecurityTrustResourceUrl(
      URL.createObjectURL(bibtex),
    );
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
        },
      );
    });
  }

  onHidden() {
    this.visible = false;
    this.subscriptionManager.destroy();
  }
}
