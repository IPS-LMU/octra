import {Component, Input, OnInit, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {TranscriptionService} from '../../shared/service';

@Component({
  selector: 'app-guidelines',
  templateUrl: './guidelines.component.html',
  styleUrls: ['./guidelines.component.css']
})
export class GuidelinesComponent implements OnInit {

  public visible = false;
  @Input() guidelines = null;
  public shown_guidelines: any = {};
  public collapsed: any[][] = [];
  private video_players: any[] = [];

  constructor(private transcrService: TranscriptionService, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
  }

  ngOnChanges($event) {
    if (!($event.guidelines.currentValue === null || $event.guidelines.currentValue === undefined)) {
      this.shown_guidelines = JSON.parse(JSON.stringify($event.guidelines.currentValue));
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
}
