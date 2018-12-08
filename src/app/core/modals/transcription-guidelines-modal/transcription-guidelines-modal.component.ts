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
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, SettingsService, TranscriptionService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {BugReportService} from '../../shared/service/bug-report.service';
import {TranslateService} from '@ngx-translate/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Component({
  selector: 'app-transcription-guidelines-modal',
  templateUrl: './transcription-guidelines-modal.component.html',
  styleUrls: ['./transcription-guidelines-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})

export class TranscriptionGuidelinesModalComponent implements OnInit, OnChanges {
  modalRef: BsModalRef;
  public visible = false;
  @Input() guidelines = null;
  public shown_guidelines: any = {};
  public collapsed: any[][] = [];
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal') modal: any;
  protected data = null;
  private entries = 0;
  private counter = 0;
  private video_players: any[] = [];
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  constructor(private modalService: BsModalService, private lang: TranslateService, public transcrService: TranscriptionService,
              private appStorage: AppStorageService, private bugService: BugReportService, private settService: SettingsService,
              private cd: ChangeDetectorRef, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
  }

  ngOnChanges($event) {
    if (!($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
      this.shown_guidelines = JSON.parse(JSON.stringify($event.guidelines.currentValue));
      this.unCollapseAll();
    }
    if (($event.guidelines.previousValue === null || $event.guidelines.previousValue === undefined) && !($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
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
    for (let i = 0; i < this.video_players.length; i++) {
      if (this.video_players[i].id_ === player) {
        return i;
      }
    }
    return -1;
  }

  initVideoPlayers() {
    for (let g = 0; g < this.guidelines.instructions.length; g++) {
      for (let i = 0; i < this.guidelines.instructions[g].entries.length; i++) {
        for (let e = 0; e < this.guidelines.instructions[g].entries[i].examples.length; e++) {
          const id_v = 'my-player_g' + g + 'i' + i + 'e' + e;
          if (document.getElementById(id_v)) {

            const old_player = this.videoplayerExists(id_v);

            if (old_player > -1) {
              // videojs(document.getElementById(id_v)).dispose();
            } else {
              const player = videojs(id_v, {
                'fluid': true,
                'autoplay': false,
                'preload': 'auto'
              }, function onPlayerReady() {
              });

              this.video_players.push(player);
            }
          }
        }
      }
    }
  }

  public exportPDF() {
    if (!(this.settService.projectsettings === null || this.settService.projectsettings === undefined)
      && !(this.settService.projectsettings.plugins === null || this.settService.projectsettings.plugins === undefined)
      && !(this.settService.projectsettings.plugins.pdfexport === null || this.settService.projectsettings.plugins.pdfexport === undefined)
      && !(this.settService.projectsettings.plugins.pdfexport.url === null || this.settService.projectsettings.plugins.pdfexport.url === undefined)) {
      const form = jQuery('<form></form>')
        .attr('method', 'post')
        .attr('target', 'blank')
        .attr('action', this.settService.projectsettings.plugins.pdfexport.url)
        .appendTo('body');

      const json_obj = {
        translation: this.lang.instant('general'),
        guidelines: this.guidelines
      };

      const json = jQuery('<input/>')
        .attr('name', 'json')
        .attr('type', 'text')
        .attr('value', JSON.stringify(json_obj));
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

  private unCollapseAll() {
    this.collapsed = [];

    for (let i = 0; i < this.guidelines.instructions.length; i++) {
      const elem = [];
      for (let j = 0; j < this.guidelines.instructions[i].entries.length; j++) {
        elem.push(true);
      }
      this.collapsed.push(elem);
    }
  }

  private toggle(group: number, entry: number) {
    this.collapsed[group][entry] = !this.collapsed[group][entry];
  }

  private search(text: string) {
    if (text !== '') {
      this.shown_guidelines.instructions = [];

      for (let i = 0; i < this.guidelines.instructions.length; i++) {
        const instruction = this.guidelines.instructions[i];
        if (instruction.group.indexOf(text) > -1) {
          this.shown_guidelines.instructions.push(instruction);
        } else {
          const instr = JSON.parse(JSON.stringify(instruction));
          instr.entries = [];

          for (let e = 0; e < instruction.entries.length; e++) {
            const entry = instruction.entries[e];
            if (entry.title.indexOf(text) > -1
              || entry.description.indexOf(text) > -1
            ) {
              instr.entries.push(entry);
            }
          }

          if (instr.entries.length > 0) {
            this.shown_guidelines.instructions.push(instr);
          }
        }
      }
    } else {
      this.shown_guidelines = JSON.parse(JSON.stringify(this.guidelines));
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
}
