import {
  Component,
  OnInit,
  SecurityContext,
  ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';
import { timer } from 'rxjs';
import { SettingsService } from '../../shared/service';
import { OctraModal } from '../types';
import videojs from 'video.js';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraGuidelines } from '@octra/assets';

@Component({
  selector: 'octra-transcription-guidelines-modal',
  templateUrl: './transcription-guidelines-modal.component.html',
  styleUrls: ['./transcription-guidelines-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TranscriptionGuidelinesModalComponent
  extends OctraModal
  implements OnInit
{
  public static options: NgbModalOptions = {
    size: 'xl',
    backdrop: true,
    keyboard: false,
    scrollable: true,
  };

  protected guidelines?: OctraGuidelines;
  public shownGuidelines?: OctraGuidelines;
  public collapsed: any[][] = [];

  protected data = undefined;
  private videoPlayers: any[] = [];

  constructor(
    private lang: TranslocoService,
    public annotationStoreService: AnnotationStoreService,
    public settService: SettingsService,
    private sanitizer: DomSanitizer,
    protected override activeModal: NgbActiveModal
  ) {
    super('transcriptionGuidelinesModal', activeModal);
  }

  async ngOnInit() {
    if (this.annotationStoreService.guidelines) {
      this.guidelines = await this.prepareGuidelines(
        this.annotationStoreService.guidelines
      );
      this.shownGuidelines = { ...this.guidelines } as any;
      this.unCollapseAll();
      this.subscriptionManager.add(
        timer(1000).subscribe(() => {
          this.initVideoPlayers();
        })
      );
    }
  }

  private async prepareGuidelines(
    guidelines: OctraGuidelines
  ): Promise<OctraGuidelines | undefined> {
    if (!guidelines) {
      return undefined;
    }

    const result = JSON.parse(JSON.stringify(guidelines));
    for (let i = 0; i < result.instructions.length; i++) {
      for (let j = 0; j < result.instructions[i].entries.length; j++) {
        result.instructions[i].entries[j] = {
          ...result.instructions[i].entries[j],
          description: (await this.getGuidelineHTML(
            result.instructions[i].entries[j].description
          )) as string,
        };

        for (const example of result.instructions[i].entries[j].examples) {
          example.annotation = (await this.getGuidelineHTML(
            example.annotation
          )) as string;
        }
      }
    }
    return result;
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
    if (this.guidelines) {
      for (let g = 0; g < this.guidelines.instructions.length; g++) {
        for (
          let i = 0;
          i < this.guidelines.instructions[g].entries.length;
          i++
        ) {
          for (
            let e = 0;
            e < this.guidelines.instructions[g].entries[i].examples.length;
            e++
          ) {
            const idV = 'my-player_g' + g + 'i' + i + 'e' + e;
            if (document.getElementById(idV)) {
              const oldPlayer = this.videoplayerExists(idV);

              if (oldPlayer > -1) {
                // videojs(document.getElementById(id_v)).dispose();
              } else {
                const player = videojs(idV, {
                  fluid: true,
                  autoplay: false,
                  preload: 'auto',
                });

                this.videoPlayers.push(player);
              }
            }
          }
        }
      }
    }
  }

  public exportPDF() {
    if (
      this.settService.projectsettings !== undefined &&
      this.settService.projectsettings.plugins !== undefined &&
      this.settService.projectsettings.plugins.pdfexport !== undefined &&
      this.settService.projectsettings.plugins.pdfexport.url !== undefined
    ) {
      const form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('target', 'blank');
      form.style.display = 'none';
      form.setAttribute(
        'action',
        this.settService.projectsettings.plugins.pdfexport.url
      );

      document.body.appendChild(form);

      const jsonObj = {
        translation: this.lang.translate('g'),
        guidelines: this.guidelines,
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

  toggle(group: number, entry: number) {
    this.collapsed[group][entry] = !this.collapsed[group][entry];
  }

  search(text: string) {
    if (text !== '' && this.shownGuidelines) {
      this.shownGuidelines.instructions = [];
      if (this.guidelines) {
        for (const instruction of this.guidelines.instructions) {
          if (instruction.group.indexOf(text) > -1) {
            this.shownGuidelines.instructions.push(instruction);
          } else {
            const instr = JSON.parse(JSON.stringify(instruction));
            instr.entries = [];

            for (const entry of instruction.entries) {
              if (
                entry.title.indexOf(text) > -1 ||
                entry.description.indexOf(text) > -1
              ) {
                instr.entries.push(entry);
              }
            }

            if (instr.entries.length > 0) {
              this.shownGuidelines.instructions.push(instr);
            }
          }
        }
      }
    } else {
      this.shownGuidelines = JSON.parse(JSON.stringify(this.guidelines));
    }
  }

  public async getGuidelineHTML(text: string): Promise<SafeHtml> {
    let html = text ?? '';
    if (text.indexOf('{{') > -1) {
      const regex = /{{([^{}]+)}}/g;
      let matches = regex.exec(text);
      const replacements: {
        start: number;
        length: number;
        text: string;
      }[] = [];

      while (matches && matches.length > 1) {
        replacements.push({
          start: matches.index,
          length: matches[0].length,
          text: (
            await this.annotationStoreService.rawToHTML(matches[1])
          ).replace(/(<p>)|(<\/p>)|(<br\/>)/g, ''),
        });
        matches = regex.exec(text);
      }

      for (let i = replacements.length - 1; i >= 0; i--) {
        const replacement = replacements[i];
        html =
          html.substring(0, replacement.start) +
          replacement.text +
          html.substring(replacement.start + replacement.length);
      }
    } else {
      html = `${html}`;
    }

    return this.sanitizer.sanitize(SecurityContext.HTML, html)!;
  }

  private unCollapseAll() {
    this.collapsed = [];

    if (this.guidelines) {
      for (const instruction of this.guidelines.instructions) {
        const elem = [];
        for (const entry of instruction.entries) {
          elem.push(true);
        }
        this.collapsed.push(elem);
      }
    }
  }
}
