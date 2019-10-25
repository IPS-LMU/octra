import {Component, Input, OnChanges, OnInit, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {SettingsService, TranscriptionService} from '../../shared/service';

@Component({
  selector: 'app-guidelines',
  templateUrl: './guidelines.component.html',
  styleUrls: ['./guidelines.component.css']
})
export class GuidelinesComponent implements OnInit, OnChanges {

  public visible = false;
  @Input() guidelines = null;
  public shownGuidelines: any = {};
  public collapsed: any[][] = [];
  private videoPlayers: any[] = [];

  constructor(private transcrService: TranscriptionService, private sanitizer: DomSanitizer, public settService: SettingsService) {
  }

  ngOnInit() {
  }

  ngOnChanges($event) {
    if (!($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
      this.shownGuidelines = JSON.parse(JSON.stringify($event.guidelines.currentValue));
      this.unCollapseAll();
    }
    if (($event.guidelines.previousValue === null || $event.guidelines.previousValue === undefined)
      && !($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
      setTimeout(() => {
        this.initVideoPlayers();
      }, 1000);
    }
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

  toggle(group: number, entry: number) {
    this.collapsed[group][entry] = !this.collapsed[group][entry];
  }

  private search(text: string) {
    if (text !== '') {
      this.shownGuidelines.instructions = [];

      for (let i = 0; i < this.guidelines.instructions.length; i++) {
        const instruction = this.guidelines.instructions[i];
        if (instruction.group.indexOf(text) > -1) {
          this.shownGuidelines.instructions.push(instruction);
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
}
