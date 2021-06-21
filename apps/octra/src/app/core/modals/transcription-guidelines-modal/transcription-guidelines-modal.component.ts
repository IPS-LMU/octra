import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  SecurityContext,
  ViewEncapsulation
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {Subscription, timer} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService, TranscriptionService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import * as videojs from 'video.js';
import {MDBModalRef, MDBModalService} from 'angular-bootstrap-md';
import {OctraModal} from '../types';

@Component({
  selector: 'octra-transcription-guidelines-modal',
  templateUrl: './transcription-guidelines-modal.component.html',
  styleUrls: ['./transcription-guidelines-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class TranscriptionGuidelinesModalComponent extends OctraModal implements OnInit {
  public get guidelines() {
    return this.transcrService.guidelines;
  }

  public shownGuidelines: any;
  public collapsed: any[][] = [];

  protected data = undefined;
  private entries = 0;
  private videoPlayers: any[] = [];
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(modalService: MDBModalService, private lang: TranslocoService, public transcrService: TranscriptionService,
              private appStorage: AppStorageService, private bugService: BugReportService, public settService: SettingsService,
              private cd: ChangeDetectorRef, private sanitizer: DomSanitizer, modalRef: MDBModalRef) {
    super('transcriptionGuidelinesModal', modalRef, modalService);
  }

  ngOnInit() {
    this.shownGuidelines = JSON.parse(JSON.stringify(this.guidelines));
    this.unCollapseAll();
    this.subscrmanager.add(timer(1000).subscribe(() => {
      this.initVideoPlayers();
    }));
  }

  videoplayerExists(player: string): number {
    for (let i = 0; i < this.videoPlayers.length; i++) {
      if (this.videoPlayers[i].id_ === player) {
        return i;
      }
    }
    return -1;
  }

  initVideoPlayers() {
    for (let g = 0; g < this.guidelines.instructions.length; g++) {
      for (let i = 0; i < this.guidelines.instructions[g].entries.length; i++) {
        for (let e = 0; e < this.guidelines.instructions[g].entries[i].examples.length; e++) {
          const idV = 'my-player_g' + g + 'i' + i + 'e' + e;
          if (document.getElementById(idV)) {

            const oldPlayer = this.videoplayerExists(idV);

            if (oldPlayer > -1) {
              // videojs(document.getElementById(id_v)).dispose();
            } else {
              const player = videojs(idV, {
                fluid: true,
                autoplay: false,
                preload: 'auto'
              });

              this.videoPlayers.push(player);
            }
          }
        }
      }
    }
  }

  public exportPDF() {
    if (
      this.settService.projectsettings !== undefined
      && this.settService.projectsettings.plugins !== undefined
      && this.settService.projectsettings.plugins.pdfexport !== undefined
      && this.settService.projectsettings.plugins.pdfexport.url !== undefined
    ) {
      const form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('target', 'blank');
      form.style.display = 'none';
      form.setAttribute('action', this.settService.projectsettings.plugins.pdfexport.url);

      document.body.appendChild(form);

      const jsonObj = {
        translation: this.lang.translate('general'),
        guidelines: this.guidelines
      };

      const json = document.createElement('input');
      json.setAttribute('name', 'json');
      json.setAttribute('type', 'text');
      json.setAttribute('value', JSON.stringify(jsonObj));

      form.append(json);
      form.submit();
      form.remove();
    }
  }

  public close() {
    this.cd.markForCheck();
    this.cd.detectChanges();

    return super.close();
  }

  toggle(group: number, entry: number) {
    this.collapsed[group][entry] = !this.collapsed[group][entry];
  }

  search(text: string) {
    if (text !== '') {
      this.shownGuidelines.instructions = [];

      for (const instruction of this.guidelines.instructions) {
        if (instruction.group.indexOf(text) > -1) {
          this.shownGuidelines.instructions.push(instruction);
        } else {
          const instr = JSON.parse(JSON.stringify(instruction));
          instr.entries = [];

          for (const entry of instruction.entries) {
            if (entry.title.indexOf(text) > -1
              || entry.description.indexOf(text) > -1
            ) {
              instr.entries.push(entry);
            }
          }

          if (instr.entries.length > 0) {
            this.shownGuidelines.instructions.push(instr);
          }
        }
      }
    } else {
      this.shownGuidelines = JSON.parse(JSON.stringify(this.guidelines));
    }
  }

  public getGuidelineHTML(text): SafeHtml {
    let html = text;
    if (text.indexOf('{{') > -1) {
      html = text.replace(/{{([^{}]+)}}/g, (g0, g1) => {
        return this.transcrService.rawToHTML(g1).replace(/(<p>)|(<\/p>)|(<br\/>)/g, '');
      });
    } else {
      html = `${html}`;
    }

    return this.sanitizer.sanitize(SecurityContext.HTML, html);
  }

  public isPDFExportEnabled() {
    return this.settService.projectsettings.plugins.pdfexport !== undefined
      && this.settService.projectsettings.plugins.pdfexport.url !== undefined;
  }

  public isPDFLinkOnly() {
    return this.isPDFExportEnabled() && this.settService.projectsettings.plugins.pdfexport.url.indexOf('pdfconverter') < 0;
  }

  public getPDFNameFromLink() {
    const url = this.settService.projectsettings.plugins.pdfexport.url;
    if (this.isPDFLinkOnly() && url.lastIndexOf('/') > -1) {
      return url.substr(url.lastIndexOf('/') + 1);
    }

    return '';
  }

  private unCollapseAll() {
    this.collapsed = [];

    for (const instruction of this.guidelines.instructions) {
      const elem = [];
      for (const entry of instruction.entries) {
        elem.push(true);
      }
      this.collapsed.push(elem);
    }
  }
}
