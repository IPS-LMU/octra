import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SecurityContext,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {Subject, Subscription, timer} from 'rxjs';
import {SubscriptionManager} from '@octra/utilities';
import {SettingsService, TranscriptionService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {BugReportService} from '../../shared/service/bug-report.service';
import * as videojs from 'video.js';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-transcription-guidelines-modal',
  templateUrl: './transcription-guidelines-modal.component.html',
  styleUrls: ['./transcription-guidelines-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class TranscriptionGuidelinesModalComponent implements OnChanges {
  modalRef: MdbModalRef<TranscriptionGuidelinesModalComponent>;
  public visible = false;
  @Input() guidelines = undefined;
  public shownGuidelines: any = {};
  public collapsed: any[][] = [];
  config: MdbModalConfig = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false,
    modalClass: 'modal-lg'
  };
  @ViewChild('modal', {static: false}) modal: any;
  protected data = undefined;
  private entries = 0;
  private counter = 0;
  private videoPlayers: any[] = [];
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();

  constructor(private modalService: MdbModalService, private lang: TranslocoService, public transcrService: TranscriptionService,
              private appStorage: AppStorageService, private bugService: BugReportService, public settService: SettingsService,
              private cd: ChangeDetectorRef, private sanitizer: DomSanitizer) {
  }

  ngOnChanges($event) {
    if (!($event.guidelines.currentValue === undefined || $event.guidelines.currentValue === undefined)) {
      this.shownGuidelines = JSON.parse(JSON.stringify($event.guidelines.currentValue));
      this.unCollapseAll();
    }
    if (($event.guidelines.previousValue === undefined || $event.guidelines.previousValue === undefined) &&
      !($event.guidelines.currentValue === undefined || $event.guidelines.currentValue === undefined)) {
      this.subscrmanager.add(timer(1000).subscribe(() => {
        this.initVideoPlayers();
      }));
    }
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.visible = true;
      this.cd.markForCheck();
      this.cd.detectChanges();

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
    this.modal.hide();
    this.visible = false;

    this.cd.markForCheck();
    this.cd.detectChanges();

    this.actionperformed.next();
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
