import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SecurityContext,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {isUnset} from 'octra-components';
import {Subject} from 'rxjs';
import {SubscriptionManager} from 'octra-components';
import {AppStorageService, SettingsService, TranscriptionService} from '../../shared/service';
import {BugReportService} from '../../shared/service/bug-report.service';

@Component({
  selector: 'octra-transcription-guidelines-modal',
  templateUrl: './transcription-guidelines-modal.component.html',
  styleUrls: ['./transcription-guidelines-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class TranscriptionGuidelinesModalComponent implements OnInit, OnChanges {
  modalRef: BsModalRef;
  public visible = false;
  @Input() guidelines = null;
  public shownGuidelines: any = {};
  public collapsed: any[][] = [];
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: false}) modal: any;
  protected data = null;
  private entries = 0;
  private counter = 0;
  private videoPlayers: any[] = [];
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  constructor(private modalService: BsModalService, private lang: TranslocoService, public transcrService: TranscriptionService,
              private appStorage: AppStorageService, private bugService: BugReportService, public settService: SettingsService,
              private cd: ChangeDetectorRef, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
  }

  ngOnChanges($event) {
    if (!($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
      this.shownGuidelines = JSON.parse(JSON.stringify($event.guidelines.currentValue));
      this.unCollapseAll();
    }
    if (($event.guidelines.previousValue === null || $event.guidelines.previousValue === undefined) &&
      !($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
      setTimeout(() => {
        this.initVideoPlayers();
      }, 1000);
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
              }, function onPlayerReady() {
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
      !isUnset(this.settService.projectsettings)
      && !isUnset(this.settService.projectsettings.plugins)
      && !isUnset(this.settService.projectsettings.plugins.pdfexport)
      && !isUnset(this.settService.projectsettings.plugins.pdfexport.url)
    ) {
      const form = jQuery('<form></form>')
        .attr('method', 'post')
        .attr('target', 'blank')
        .attr('action', this.settService.projectsettings.plugins.pdfexport.url)
        .appendTo('body');

      const jsonObj = {
        translation: this.lang.translate('general'),
        guidelines: this.guidelines
      };

      const json = jQuery('<input/>')
        .attr('name', 'json')
        .attr('type', 'text')
        .attr('value', JSON.stringify(jsonObj));
      form.append(json);
      form.submit().remove();
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
