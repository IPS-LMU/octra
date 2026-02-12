import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions, NgbNav, NgbNavContent, NgbNavItem, NgbNavLinkButton, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { OctraAnnotationSegment } from '@octra/annotation';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { escapeHtml, escapeRegex, insertString, last } from '@octra/utilities';
import { fadeInExpandOnEnterAnimation, fadeOutCollapseOnLeaveAnimation } from 'angular-animations';
import { timer } from 'rxjs';
import { AppInfo } from '../../../../app.info';
import { AlertService, AudioService, SettingsService } from '../../../shared/service';
import { AnnotationStoreService } from '../../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../../types';

@Component({
  selector: 'octra-reg-replace-modal',
  templateUrl: './reg-replace-modal.component.html',
  styleUrls: ['./reg-replace-modal.component.scss'],
  animations: [fadeOutCollapseOnLeaveAnimation(), fadeInExpandOnEnterAnimation()],
  imports: [FormsModule, TranslocoPipe, OctraUtilitiesModule, NgbNavOutlet, NgbNavItem, NgbNavContent, NgbNavLinkButton, NgbNav, NgClass],
  encapsulation: ViewEncapsulation.None,
})
export class RegReplaceModalComponent extends OctraModal implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild('textPattern') textPattern?: ElementRef;
  annotationStoreService = inject(AnnotationStoreService);
  audio = inject(AudioService);
  transloco = inject(TranslocoService);
  protected settings = inject(SettingsService);
  protected alertService = inject(AlertService);
  protected override activeModal: NgbActiveModal;
  protected renderer: Renderer2 = inject(Renderer2);
  protected el: ElementRef = inject(ElementRef);

  segmentOpened = new EventEmitter<{
    itemID: number;
    levelID: number;
  }>();

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
    scrollable: true,
    fullscreen: true,
  };

  protected state: {
    mode: 'search' | 'replace';
    status: string;
    patternText: string;
    patternType: 'text' | 'regex';
    replacement: string;
    levels: Record<string, boolean>;
    results: {
      levelID: number;
      levelName: string;
      matches: {
        unitID: number;
        startUnix?: number;
        replacements: {
          start: number;
          length: number;
        }[];
        html: string;
        skip: boolean;
      }[];
    }[];
    preview: {
      selectedLevel?: string;
      active: boolean;
    };
  } = {
    mode: 'search',
    status: 'idle',
    patternType: 'text',
    patternText: '',
    replacement: '',
    levels: {},
    results: [],
    preview: {
      active: false,
    },
  };

  protected data = undefined;

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('RegReplaceModalComponent', activeModal);

    this.activeModal = activeModal;
    this.renderer.addClass(this.el.nativeElement, 'h-100');
  }

  execute(preview = false) {
    const pattern = this.state.patternType === 'text' ? escapeRegex(this.state.patternText) : this.state.patternText;
    const regex = new RegExp(pattern, 'g');
    const selectedLevels = Object.keys(this.state.levels).filter((a) => this.state.levels[a] === true);
    const transcript = this.annotationStoreService.transcript.clone();

    if (selectedLevels. length > 0 && this.state.patternText !== '') {
      if (preview) {
        this.state.results = [];

        for (const level of transcript.levels) {
          if (selectedLevels.includes(level.name)) {
            this.state.results.push({
              levelID: level.id,
              levelName: level.name,
              matches: [],
            });
            const result = last(this.state.results);

            for (const item of level.items) {
              const transcriptLabel = item.getFirstLabelWithoutName('Speaker');
              const replacements = [];
              let html: string | undefined;

              if (transcriptLabel?.value) {
                const transcript = transcriptLabel.value;
                html = transcriptLabel.value;

                let matches = regex.exec(transcript);

                while (matches !== null) {
                  replacements.push({
                    start: matches.index,
                    length: matches[0].length,
                    text: this.state.mode === 'replace' ? matches[0].replace(new RegExp(regex, 'g'), this.state.replacement) : matches[0],
                  });
                  matches = regex.exec(transcript);
                }
              }

              if (replacements.length > 0) {
                for (let i = replacements.length - 1; i > -1; i--) {
                  const replacement = replacements[i];
                  const start = `<div class="reg-replace-marker">`;
                  const end = `</div>`;
                  html = insertString(html, replacement.start + replacement.length, end);
                  html = html.slice(0, replacement.start) + (escapeHtml(replacement.text) || '&nbsp;') + html.slice(replacement.start + replacement.length);
                  html = insertString(html, replacement.start, start);
                }

                result.matches.push({
                  startUnix: item.type === 'segment' ? (item as OctraAnnotationSegment).time.unix : undefined,
                  unitID: item.id,
                  replacements,
                  html,
                  skip: false,
                });
              }
            }

            if (result.matches.length === 0) {
              this.state.results.splice(this.state.results.length - 1, 1);
            }
          }
        }

        if (this.state.results.length > 0) {
          this.state.preview.selectedLevel = this.state.results[0].levelName;
        }
      } else {
        // no preview, execute
        for (const level of this.state.results) {
          for (const match of level.matches) {
            if (!match.skip) {
              const item = transcript.getItemById(match.unitID);

              if (item) {
                item.replaceFirstLabelWithoutName('Speaker', (value) => {
                  return value.replace(regex, this.state.replacement);
                });
              }
            }
          }
        }

        this.annotationStoreService.changeLevels(transcript.levels);
        this.alertService.showAlert('success', 'Successfully replaced matches.');
      }
    }

    this.state.preview.active = true;
  }

  somethingChanged() {
    this.state.preview.active = false;
    this.state.results = [];
  }

  ngOnInit() {
    this.annotationStoreService.transcript.levels.forEach((a) => {
      this.state.levels[a.name] = true;
    });
  }

  ngAfterViewInit() {
    this.textPattern?.nativeElement.focus();
  }

  openSegment(itemID: number, level: number) {
    this.segmentOpened.emit({ itemID, levelID: level });
    this.subscribe(timer(0), {
      next: () => {
        this.close();
      },
    });
  }

  captureEnterKey($event: KeyboardEvent) {
    if ($event.key === 'Enter') {
      this.execute(true);

      $event.preventDefault();
      $event.stopPropagation();
      $event.stopImmediatePropagation();
    }
  }
}
