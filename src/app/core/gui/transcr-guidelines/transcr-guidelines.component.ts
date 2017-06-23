import {AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {ModalComponent} from 'ng2-bs3-modal/components/modal';
import {isNullOrUndefined} from 'util';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {TranslateService} from '@ngx-translate/core';
import {SettingsService} from '../../shared/service/settings.service';

@Component({
  selector: 'app-transcr-guidelines',
  templateUrl: './transcr-guidelines.component.html',
  styleUrls: ['./transcr-guidelines.component.css']
})

export class TranscrGuidelinesComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('modal_guidelines') modal_guidelines: ModalComponent;

  @Input() guidelines = null;
  private shown_guidelines: any = {};

  private subscrmanager: SubscriptionManager = new SubscriptionManager();
  private collapsed: any[][] = [];
  private entries = 0;

  private counter = 0;
  private video_players: any[] = [];

  constructor(private transcrService: TranscriptionService,
              private cd: ChangeDetectorRef,
              private lang: TranslateService,
              private settService: SettingsService) {
    /*
     this.subscrmanager.add(
     transcrService.guidelinesloaded.subscribe(
     (guidelines) => {
     this.init();
     }
     )
     );
     */
    if (!isNullOrUndefined(this.transcrService.guidelines)) {
      this.init();
    }
  }

  get visible(): boolean {
    return this.modal_guidelines.visible;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {

  }

  init() {
    this.entries = 0;
    this.guidelines = this.transcrService.guidelines;

    for (let i = 0; i < this.transcrService.guidelines.instructions.length; i++) {
      this.entries += this.transcrService.guidelines.instructions[i].entries.length;
    }

    this.initVideoPlayers();

    this.unCollapseAll();
  }

  ngOnChanges($event) {
    if (!isNullOrUndefined($event.guidelines.currentValue)) {
      this.shown_guidelines = JSON.parse(JSON.stringify($event.guidelines.currentValue));
    }
    if (isNullOrUndefined($event.guidelines.previousValue) && !isNullOrUndefined($event.guidelines.currentValue)) {
      setTimeout(() => {
        this.initVideoPlayers();
      }, 1000);
    }
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

  public open() {
    this.modal_guidelines.open();
  }

  public close() {
    this.modal_guidelines.dismiss();
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

  videoplayerExists(player: string): number {
    for (let i = 0; i < this.video_players.length; i++) {
      if (this.video_players[i].id_ === player) {
        return i;
      }
    }
    return -1;
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

  public exportPDF() {
    if (!isNullOrUndefined(this.settService.projectsettings)
      && !isNullOrUndefined(this.settService.projectsettings.plugins)
      && !isNullOrUndefined(this.settService.projectsettings.plugins.pdfexport)
      && !isNullOrUndefined(this.settService.projectsettings.plugins.pdfexport.url)) {
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
}
