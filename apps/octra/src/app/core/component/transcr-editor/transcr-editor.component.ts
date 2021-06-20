import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import {isNumeric} from 'rxjs/internal-compatibility';
import {Subscription, timer} from 'rxjs';

import {BrowserInfo} from '../../shared';
import {TranscriptionService} from '../../shared/service';
import {ASRProcessStatus, ASRQueueItem, AsrService} from '../../shared/service/asr.service';
import {TranscrEditorConfig} from './config';
import {ValidationPopoverComponent} from './validation-popover/validation-popover.component';
import {
  escapeHtml,
  escapeRegex,
  findElements,
  getAttr,
  insertString,
  isNumber,
  setStyle,
  ShortcutGroup,
  ShortcutManager,
  SubscriptionManager,
  unEscapeHtml
} from '@octra/utilities';
import {AudioChunk, AudioManager, SampleUnit} from '@octra/media';
import {Segments} from '@octra/annotation';
import {TimespanPipe} from '@octra/components';
import {JoditAngularComponent} from 'jodit-angular';
/// <reference path="../../../../../../node_modules/@types/summernote/index.d.ts" />
declare let tidyUpAnnotation: ((string, any) => any);

declare let document: any;

@Component({
  selector: 'octra-transcr-editor',
  templateUrl: './transcr-editor.component.html',
  styleUrls: ['./transcr-editor.component.scss'],
  providers: [TranscrEditorConfig],
  encapsulation: ViewEncapsulation.None
})
export class TranscrEditorComponent implements OnDestroy, OnChanges, AfterViewInit {
  @Output() loaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onkeyup: EventEmitter<any> = new EventEmitter<any>();
  @Output() markerInsert: EventEmitter<string> = new EventEmitter<string>();
  @Output() markerClick: EventEmitter<string> = new EventEmitter<string>();
  @Output() typing = new EventEmitter<string>();
  @Output() boundaryclicked: EventEmitter<SampleUnit> = new EventEmitter<SampleUnit>();
  @Output() boundaryinserted: EventEmitter<number> = new EventEmitter<number>();
  @Output() selectionchanged: EventEmitter<number> = new EventEmitter<number>();
  @Input() visible = true;
  @Input() markers: any = true;
  @Input() easymode = true;
  @Input() height = 0;
  @Input() playposition: SampleUnit;
  @Input() audiochunk: AudioChunk;
  @Input() validationEnabled = false;
  @Input() externalShortcutManager: ShortcutManager;
  // tslint:disable-next-line:no-output-on-prefix
  @Output() redoUndo = new EventEmitter<'undo' | 'redo'>();

  @ViewChild('validationPopover', {static: true}) validationPopover: ValidationPopoverComponent;
  @ViewChild('transcrEditor', {static: true}) transcrEditor: ElementRef;
  @ViewChild('jodit', {static: true}) jodit: JoditAngularComponent;
  public focused = false;

  public joditOptions: any;

  public asr = {
    status: 'inactive',
    result: '',
    error: ''
  };
  size = {
    height: 100,
    width: 100
  };
  public popovers: {
    segmentBoundary: HTMLElement;
    validationError: HTMLElement;
  } = {
    segmentBoundary: undefined,
    validationError: undefined
  };
  public popoversNew = {
    validation: {
      location: {
        x: 0,
        y: 0
      },
      visible: false,
      currentGuideline: {
        description: '',
        title: ''
      }
    }
  };
  @Output() highlightingEnabledChange = new EventEmitter();
  @Input() segments: Segments = undefined;
  @Input() public transcript = '';
  private internalTyping: EventEmitter<string> = new EventEmitter<string>();
  private shortcutsManager: ShortcutManager;
  private _lastAudioChunkID = -1;
  private _settings: TranscrEditorConfig;
  private subscrmanager: SubscriptionManager<Subscription>;
  private init = 0;
  private lastkeypress = 0;
  private lastCursorPosition: {
    collapsed: boolean;
    startId: string;
    endId?: string;
    startMarker: string;
    endMarker?: string;
  };
  private highlightingRunning = false;
  private lockHighlighting = false;
  private lastHighlightedSegment = -1;

  private isValidating = false;
  private validationFinish = new EventEmitter();
  private shortcuts: ShortcutGroup = {
    name: 'texteditor',
    enabled: true,
    items: []
  }

  public htmlValue = '';

  constructor(private cd: ChangeDetectorRef,
              private langService: TranslocoService,
              private transcrService: TranscriptionService,
              private asrService: AsrService) {
    this.shortcutsManager = new ShortcutManager();
    this._settings = new TranscrEditorConfig();
    this.subscrmanager = new SubscriptionManager<Subscription>();

    this.joditOptions = {
      'showCharsCounter': false,
      'showWordsCounter': false,
      'showXPathInStatusbar': false,
      'disablePlugins': 'image-processor,image-properties,image,video,media,file,resize-cells,select-cells,' +
        'table-keyboard-navigation,table,preview,print,about,drag-and-drop,iframe,indent,inline-popup,' +
        'drag-and-drop-element,format-block,resizer,hr,hotkeys,fullsize,font,justify,limit,link,class-span,' +
        'bold,delete,clean-html,wrap-text-nodes,copy-format,clipboard,paste,paste-storage,color,enter,' +
        'error-messages,mobile,ordered-list,placeholder,redo-undo,search,select,size,resize-handler,' +
        'source,stat,sticky,symbols,xpath,tooltip',
      events: {
        keyup: this.onKeyUp,
        keydown: this.onKeyDown,
        focus: () => {
          this.focused = true;
        },
        blur: () => {
          this.focused = false;
        },
        mouseup: () => {
          // TODO this.selectionchanged.emit(this.caretpos);
        },
        afterInit: () => {
          // fix additional <p><br/></p>
          this.subscrmanager.add(timer(100).subscribe(() => {
            if (this.segments === undefined || this.segments.length === 0) {
              this.setTranscript(this.transcript);
            } else {
              this.setSegments(this.segments);
            }
            this.focus(true, true).then(() => {
              this.loaded.emit(true);
            }).catch((error) => {
              console.error(error);
            });
          }));
        },
        paste: (e) => {
          e.preventDefault();
          const bufferText = ((e.originalEvent || e).clipboardData || (window as any).clipboardData).getData('Text');
          let html = bufferText.replace(/(<p>)|(<\/p>)/g, '')
            .replace(new RegExp(/\\\[\\\|/, 'g'), '{').replace(new RegExp(/\\\|]/, 'g'), '}');
          html = unEscapeHtml(html);
          html = '<span>' + this.transcrService.rawToHTML(html) + '</span>';
          html = html.replace(/(<p>)|(<\/p>)|(<br\/?>)/g, '');
          const htmlObj = document.createElement('span');
          htmlObj.innerHTML = html;

          if (this.rawText !== undefined && this._rawText !== '') {
            this.jodit.editor.insertNode(htmlObj[0]);
          } else {
            this.jodit.value = html;
            this.focus(true, false).catch((error) => {
              console.error(error);
            });
          }
        },
        change: () => {
          this.init++;

          if (this.init > 1) {
            this.subscrmanager.removeByTag('typing_change');
            this.subscrmanager.add(this.internalTyping.subscribe((status) => {
              if (status === 'stopped') {
                this.validate();
                this.initPopover();
              }

              this.typing.emit(status);
            }), 'typing_change');
          }
        }
      },
      buttons: []
    };
  }

  private _highlightingEnabled = true;

  @Input() get highlightingEnabled() {
    return this._highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this._highlightingEnabled = (value !== undefined) ? value : true;
    this.highlightingEnabledChange.emit(value);
  }

  public get caretpos(): number {
    if (!this.focused) {
      return -1;
    }
    // TODO replace caret
    return -1;
  }

  get audioManager(): AudioManager {
    return this.audiochunk.audioManager;
  }

  get Settings(): TranscrEditorConfig {
    return this._settings;
  }

  set Settings(value: TranscrEditorConfig) {
    this._settings = value;
  }

  get html(): string {
    if (this.jodit !== undefined && this.jodit?.editor?.value !== undefined) {
      return this.jodit.editor.value;
    }
    return '';
  }

  get workplace() {
    return this.jodit.editor.currentPlace.workplace;
  }

  public get wisiwyg() {
    return this.workplace.getElementsByClassName('jodit-wysiwyg')[0];
  }

  get toolbar() {
    return this.jodit.editor.toolbar.container;
  }

  private _isTyping = false;

  set isTyping(value: boolean) {
    this._isTyping = value;
  }

  private _textSelection = {
    start: 0,
    end: 0
  };

  get textSelection(): { start: number; end: number } {
    return this._textSelection;
  }

  private _rawText = '';

  get rawText(): string {
    return this._rawText;
  }

  /**
   * called when key pressed in editor
   */
  onKeyDown = ($event) => {
    const shortcutInfo = this.shortcutsManager.checkKeyEvent($event, Date.now());
    if (shortcutInfo !== undefined) {
      $event.preventDefault();
      if (shortcutInfo.shortcut === 'ALT + S' && this.Settings.specialMarkers.boundary) {
        // add boundary
        this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
        this.boundaryinserted.emit(this.audiochunk.absolutePlayposition.samples);
        return;
      } else {
        if (shortcutInfo.shortcutName === 'undo' || shortcutInfo.shortcutName === 'redo') {
          if (shortcutInfo.shortcutName === 'undo') {
            this.jodit.editor.undo();
          } else {
            this.jodit.editor.redo();
          }
          this.triggerTyping();
        } else {
          for (const marker of this.markers) {
            if (marker.shortcut[shortcutInfo.platform] === shortcutInfo.shortcut) {
              $event.preventDefault();
              this.insertMarker(marker.code, marker.icon);
              this.markerInsert.emit(marker.name);
              return;
            }
          }
        }
      }
    } else {
      const externalShortcutInfo = this.externalShortcutManager.checkKeyEvent($event, Date.now());
      if (externalShortcutInfo !== undefined) {

        $event.preventDefault();
      } else {
        this.triggerTyping();
      }
    }
  }

  /**
   * called after key up in editor
   */
  onKeyUp = ($event) => {
    const shortcutInfo = this.shortcutsManager.checkKeyEvent($event, Date.now());
    if (shortcutInfo !== undefined) {
      $event.preventDefault();
    } else if (this.externalShortcutManager !== undefined) {
      const externalShortcutCommand = this.externalShortcutManager.checkKeyEvent($event, Date.now());

      if (externalShortcutCommand !== undefined) {
        $event.preventDefault();
      } else {
        this.onkeyup.emit($event);
      }
    } else {
      this.onkeyup.emit($event);
    }
  }

  /**
   * converts the editor's html text to raw text
   */
  getRawText = (replaceEmptySpaces = true) => {
    let html = this.wisiwyg.innerHTML;

    html = html.replace(/<((p)|(\s?\/p))>/g, '');
    html = html.replace(/&nbsp;/g, ' ');

    // check for markers that are utf8 symbols
    for (const marker of this.markers) {
      if (marker.icon !== undefined && marker.icon.indexOf('.png') < 0 && marker.icon.indexOf('.jpg') < 0 && marker.icon.indexOf('.gif') < 0
        && marker.icon !== '' && marker.code !== '' && marker.icon !== marker.code
      ) {
        // replace all utf8 symbols with the marker's code
        html = html.replace(new RegExp(marker.icon, 'g'), marker.code);
      }
    }

    html = this.transcrService.replaceSingleTags(html);

    const dom: HTMLElement = document.createElement('p');
    dom.innerHTML = html;

    let charCounter = 0;

    const textSelection = {
      start: -1,
      end: -1
    };

    const replaceFunc = (elem: HTMLElement) => {
      const tagName = elem.tagName;
      const text = (tagName) ? elem.outerHTML : elem.nodeValue;
      if (getAttr(elem, 'data-jodit-selection_marker') === undefined && elem.childNodes.length > 0) {
        elem.childNodes.forEach(replaceFunc);
      } else {
        let attr = getAttr(elem, 'data-marker-code');
        if (getAttr(elem, 'data-value') !== undefined) {
          const value = getAttr(elem, 'data-value');
          attr += '=' + value;
        }
        if (attr) {
          const markerCode = unEscapeHtml(attr);

          for (const marker of this.markers) {
            if (markerCode === marker.code) {
              const parent = elem.parentNode;
              parent.replaceChild(document.createTextNode(escapeHtml(markerCode)), elem);
              charCounter += markerCode.length;
              break;
            }
          }
        } else if (elem.nodeType === 3) {
          // is textNode
          const text = elem.nodeValue;
          charCounter += text.length;
          elem.innerText = text;
        } else if (tagName.toLowerCase() === 'img') {
          if (getAttr(elem, 'data-samples') !== undefined) {
            const boundaryText = `{${getAttr(elem, 'data-samples')}}`;
            const textnode = document.createTextNode(boundaryText);
            elem.parentNode.insertBefore(textnode, elem);
            elem.remove();
            charCounter += boundaryText.length;
          }
        } else if (
          getAttr(elem, 'class') === 'val-error'
          && tagName.toLowerCase() !== 'textspan'
        ) {
          elem.remove();
        } else if (
          tagName.toLowerCase() === 'span'
        ) {
          if (getAttr(elem, 'data-jodit-selection_marker') === 'start') {
            // save start selection
            textSelection.start = charCounter;
          } else if (getAttr(elem, 'data-jodit-selection_marker') === 'end') {
            // save start selection
            textSelection.end = charCounter;
          } else if (getAttr(elem, 'class') === 'highlighted') {
            elem.remove();
          } else {
            const elemText = elem.innerText;
            const textnode = document.createTextNode(elemText);
            elem.parentNode.insertBefore(textnode, elem);
            elem.remove();
            charCounter += elemText.length;
          }
        }
      }
    };

    if (textSelection.start === -1 || textSelection.end === -1) {
      textSelection.start = 0;
      textSelection.end = 0;
    }

    this._textSelection = textSelection;

    dom.childNodes.forEach(replaceFunc);

    let rawText = dom.innerText;

    if (replaceEmptySpaces) {
      rawText = rawText.replace(/[\s ]+/g, ' ');
    }

    return rawText;
  }
  /**
   * initializes the editor and the containing jodit editor
   */
  public initialize = () => {
    if (this.audiochunk !== undefined) {
      this.initializeShortcuts();
      this.shortcutsManager.unregisterShortcutGroup('texteditor');
      this.shortcutsManager.registerShortcutGroup(this.shortcuts);

      this.initToolbar();

      if (this.Settings.specialMarkers.boundary) {
        this.joditOptions.buttons.push(this.createBoundaryButton());
        if (this._settings.highlightingEnabled) {
          this.joditOptions.buttons.push(this.createHighlightingButton());
        }
      }

      const jodit = this.jodit.editor;
      jodit.registerButton({
        group: 'image', name: 'info', position: 0
      });
      this.jodit.config = this.joditOptions;

      const segmentBoundary = document.createElement('div');
      segmentBoundary.setAttribute('class', 'panel seg-popover');
      segmentBoundary.innerHTML = '00:00:000';
      this.popovers.segmentBoundary = segmentBoundary;
      this.workplace.parentNode.insertBefore(this.popovers.segmentBoundary, this.workplace);

      const validationError = document.createElement('div');
      validationError.setAttribute('class', 'card error-card');
      validationError.innerHTML = `
      <div class="card-header" style="padding:5px 10px; font-weight: bold;background-color:whitesmoke;">
      <span style="color:red;">( ! )</span> <span class="error-title"></span></div>
      <div class="card-body" style="padding:5px 10px;"></div>
      `;
      setStyle(validationError, {
        maxWidth: '500px',
        position: 'absolute',
        marginTop: '0px',
        zIndex: 200,
        display: 'none'
      });
      this.popovers.validationError = validationError;
      this.toolbar.parentNode.insertBefore(this.popovers.validationError, this.toolbar);

      this.asr.status = 'inactive';
      this.asr.error = '';
      this.asr.result = '';

      const item = this.asrService.queue.getItemByTime(this.audiochunk.time.start.samples,
        this.audiochunk.time.duration.samples);

      this.onASRItemChange(item);
      this.size.height = this.transcrEditor.nativeElement.offsetHeight;
      this.size.width = this.transcrEditor.nativeElement.offsetWidth;

      if (this._settings.highlightingEnabled) {
        this.startRecurringHighlight();
      }
    }
  }

  onASRItemChange(item: ASRQueueItem) {
    if (item !== undefined) {
      if (item.time.sampleStart === this.audiochunk.time.start.samples
        && item.time.sampleLength === this.audiochunk.time.duration.samples) {
        if (item.status === ASRProcessStatus.FINISHED) {
          this.asr.status = 'finished';
          this.asr.result = item.result;
        } else if (item.status === ASRProcessStatus.FAILED) {
          this.asr.status = 'failed';
          this.asr.error = this.asr.result;
        } else if (item.status === ASRProcessStatus.STARTED) {
          this.asr.status = 'active';
          this.asr.error = '';
          this.asr.result = '';
        } else if (item.status === ASRProcessStatus.STOPPED) {
          this.asr.status = 'inactive';
        } else if (item.status === ASRProcessStatus.NOAUTH) {
          this.asr.status = 'active';
        }
      }
    }

    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  /**
   * inserts a marker to the editors html
   */
  insertMarker = (markerCode, icon) => {
    const editor = this.jodit.editor;

    if (icon === undefined || icon === '') {
      // text only

      editor.selection.insertHTML(markerCode + ' ');
    } else {
      if (icon.indexOf('.png') > -1 || icon.indexOf('.jpg') > -1 || icon.indexOf('.gif') > -1) {
        // it's an icon
        markerCode = markerCode.replace(/(<)|(>)/g, (g0, g1, g2) => {
          if (g2 === undefined && g1 !== undefined) {
            return '&lt;';
          } else {
            return '&gt;';
          }
        });

        const element = document.createElement('img');
        element.setAttribute('src', icon);
        element.setAttribute('class', 'btn-icon-text');
        element.setAttribute('data-marker-code', markerCode);
        element.setAttribute('alt', markerCode);

        editor.selection.insertNode(element);
      } else {
        editor.selection.insertHTML(icon);
      }

    }
    this.triggerTyping();
  }

  /**
   * set focus to the very last position of the editors text
   */
  public focus = (atEnd: boolean = true, later: boolean = false) => {
    return new Promise<void>((resolve, reject) => {
      const func = () => {
        try {
          if (this.jodit.value !== '') {
            if (this.wisiwyg.innerHTML.indexOf('<p>') === 0) {
              this.placeAtEnd(this.wisiwyg.getElementsByTagName('p')[0]);
            } else {
              this.placeAtEnd(this.wisiwyg);
            }
          }
          resolve();
        } catch (exception) {
          // ignore errors
          reject(exception);
        }
      };

      if (later) {
        this.subscrmanager.add(timer(300).subscribe(() => {
          func();
        }));
      } else {
        func();
      }
    });
  }

  ngAfterViewInit() {
    this.Settings.height = this.height;
    if (this.audiochunk !== undefined) {
      this._lastAudioChunkID = this.audiochunk.id;
    }
    this.initialize();

    this.subscrmanager.add(this.asrService.queue.itemChange.subscribe((item: ASRQueueItem) => {
        this.onASRItemChange(item);
      },
      (error) => {
        console.error(error);
      }));
  }

  ngOnChanges(obj) {
    let renew = false;
    if (!(obj.markers === undefined || obj.markers === undefined) && obj.markers.previousValue !== obj.markers.currentValue
      && !obj.markers.firstChange) {
      renew = true;
    }
    if (!(obj.easymode === undefined || obj.easymode === undefined) && obj.easymode.previousValue !== obj.easymode.currentValue
      && !obj.easymode.firstChange) {
      renew = true;
    }
    if (obj.audiochunk !== undefined && obj.audiochunk.currentValue !== undefined && !obj.audiochunk.firstChange) {
      renew = true;
    }

    if (obj.transcript !== undefined && obj.transcript.currentValue !== undefined && !obj.transcript.firstChange) {
      this.setTranscript(obj.transcript.currentValue);
    }

    if (obj.segments !== undefined && obj.segments.currentValue !== undefined && !obj.segments.firstChange) {
      this.setSegments(obj.segments);
    }

    if (renew) {
      this.initialize();
      this.initPopover();
    }
  }

  ngOnDestroy() {
    this.destroy();
    // jQuery(this.transcrEditor.nativeElement).find('.jodit-wysiwyg img').off('click');
  }

  public update() {
    this.destroy();
    this.initialize();
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  /**
   * initializes the navbar bar of the editor
   */
  initToolbar() {
    this.joditOptions.buttons = [];
    if (this.markers !== undefined) {
      for (let i = 0; i < this.markers.length; i++) {
        const marker = this.markers[i];
        this.joditOptions.buttons.push(this.createMarkerButton(marker));
      }
    }
  }

  /**
   * creates a button for the toolbar
   */
  createButton(name: string, tooltip: string, content: string, onClick: () => void): any {
    return {
      name,
      getContent: () => {
        const newButton = document.createElement('button');
        newButton.innerHTML = content;
        newButton.setAttribute('class', 'btn btn-info-outline btn-sm');
        newButton.onmousedown = onClick;
        newButton.setAttribute('title', tooltip);

        return newButton;
      }
    };
  }

  /**
   * creates a marker button for the toolbar
   */
  createMarkerButton(marker): any {
    let content = '';
    const platform = BrowserInfo.platform;
    if (marker.icon === undefined || marker.icon === '' ||
      marker.icon.indexOf('.png') < 0 && marker.icon.indexOf('.jpg') < 0) {
      // text only or utf8 symbol
      content = (marker.icon !== undefined && (marker.icon.indexOf('.png') < 0 || marker.icon.indexOf('.jpg') < 0)) ? marker.icon : '';

      if (!this.easymode) {
        content += `${marker.button_text}<span class='btn-shortcut'> ` +
          `[${marker.shortcut[platform]}]</span>`;
        if (this.Settings.responsive) {
          content = `${marker.button_text}<span class='btn-shortcut d-none d-lg-inline'> ` +
            `[${marker.shortcut[platform]}]</span>`;
        }
      } else {
        content += ' ' + marker.button_text;
      }
    } else {
      if (!this.easymode) {
        content = `<img src='${marker.icon}' class='btn-icon' alt='${marker.button_text}'/>` +
          `<span class='btn-description'> ${marker.button_text}</span><span class='btn-shortcut'> ` +
          `[${marker.shortcut[platform]}]</span>`;
        if (this.Settings.responsive) {
          content = `<img src='${marker.icon}' class='btn-icon' alt='${marker.button_text}'/>` +
            `<span class='btn-description d-none d-lg-inline'> ${marker.button_text}` +
            `</span><span class='btn-shortcut d-none d-lg-inline'> [${marker.shortcut[platform]}]</span>`;
        }
      } else {
        content = `<img src='${marker.icon}' class='btn-icon' alt='${marker.button_text}'/>`;
      }
    }

    return this.createButton(marker.name, marker.description, content, () => {
      // invoke insertText method with 'hello' on editor module.
      this.insertMarker(marker.code, marker.icon);
      this.markerClick.emit(marker.name);
    });
  }

  initPopover() {
    if (this.popovers.validationError !== undefined) {
      this.popovers.validationError.style.display = 'none';
      this.popovers.segmentBoundary.style.display = 'none';
    }

    const dataSampleDivs = findElements(this.wisiwyg, '.btn-icon-text[data-samples]');
    for (const dataSampleDiv of dataSampleDivs) {
      dataSampleDiv.removeEventListener('click', null);
      dataSampleDiv.removeEventListener('mouseover', null);
      dataSampleDiv.removeEventListener('mouseleave', null);
    }

    // set popover for errors
    const valErrorDivs = findElements(this.wisiwyg, '.val-error');
    for (const valErrorDiv of valErrorDivs) {
      valErrorDiv.removeEventListener('mouseenter', null);
      valErrorDiv.removeEventListener('mouseleave', null);
    }

    const valErrorChildren = findElements(this.wisiwyg, '.val-error *');
    for (const valErrorChild of valErrorChildren) {
      valErrorChild.removeEventListener('mouseenter', null);
      valErrorChild.removeEventListener('mouseleave', null);
    }

    this.waitForValidationFinished().then(() => {
      const dataSamples = findElements(this.wisiwyg, '.btn-icon-text[data-samples]');
      for (const dataSample of dataSamples) {
        dataSample.addEventListener('click', (event) => {
          const samples = getAttr((event.target as any), 'data-samples');

          if (isNumeric(samples)) {
            this.boundaryclicked.emit(new SampleUnit(Number(samples), this.audioManager.sampleRate));
          }
        });

        dataSample.addEventListener('mouseover', (event) => {
          this.onSegmentBoundaryMouseOver(event);
        });

        dataSample.addEventListener('mouseleave', () => {
          const segPopovers = findElements(this.workplace, '.seg-popover');
          for (const segPopover of segPopovers) {
            segPopover.style.display = 'none';
          }
        });
      }

      const valErrors = findElements(this.wisiwyg, '.val-error');
      for (const valError of valErrors) {
        valError.addEventListener('mouseenter', this.onValidationErrorMouseOver);
        valError.addEventListener('mouseleave', this.onValidationErrorMouseLeave);
      }

      const valErrorsChildren = findElements(this.wisiwyg, '.val-error *');
      for (const valErrorsChild of valErrorsChildren) {
        valErrorsChild.addEventListener('mouseenter', this.onValidationErrorMouseOver);
        valErrorsChild.addEventListener('mouseleave', this.onValidationErrorMouseLeave);
      }
    });
  }

  createHighlightingButton() {
    let content = '';

    content = (this.highlightingEnabled) ? `<img src='assets/img/components/transcr-editor/highlightingEnabled.jpg'
 class='btn-icon highlight-button' style='height:15px;'/>`
      : `<img src='assets/img/components/transcr-editor/highlightingDisbled.jpg'
 class='btn-icon highlight-button' style='height:15px;'/>`;

    return this.createButton('highlight', 'enable highlighting', content, () => {
      if (this._highlightingEnabled) {
        this.stopRecurringHighlight();
        this.highlightingEnabled = false;
        const boundaries = findElements(this.wisiwyg, '.highlight-button');
        for (const boundary of boundaries) {
          boundary.setAttribute('src', 'assets/img/components/transcr-editor/highlightingDisbled.jpg');
        }
      } else {
        this.highlightingEnabled = true;
        const boundaries = findElements(this.wisiwyg, '.highlight-button');
        for (const boundary of boundaries) {
          boundary.setAttribute('src', 'assets/img/components/transcr-editor/highlightingEnabled.jpg');
        }
        this.startRecurringHighlight();
      }
    });
  }

  insertBoundary(imgURL: string) {
    const element = document.createElement('img');
    element.setAttribute('src', imgURL);
    element.setAttribute('class', 'btn-icon-text boundary');
    element.setAttribute('data-samples', this.audiochunk.absolutePlayposition.samples.toString());
    element.setAttribute('alt', '[|' + this.audiochunk.absolutePlayposition.samples.toString() + '|]');

    // timeout needed to fix summernote
    this.subscrmanager.add(timer(100).subscribe(() => {
      this.jodit.editor.selection.insertNode(element);
      this.jodit.editor.selection.insertHTML(' ');

      this.subscrmanager.add(timer(200).subscribe(() => {
        // set popover
        element.addEventListener('click', (event) => {
          const samples = getAttr(event.target, 'data-samples');

          if (isNumeric(samples)) {
            this.boundaryclicked.emit(new SampleUnit(Number(samples), this.audioManager.sampleRate));
          }
        });
        element.addEventListener('mouseover', (event) => {
          this.onSegmentBoundaryOver(event);
        });
        element.addEventListener('mouseleave', () => {
          const segPopovers = findElements(this.transcrEditor.nativeElement, '.seg-popover');
          for (const segPopover of segPopovers) {
            segPopover.style.display = 'none';
          }
          this.triggerTyping();
        });
      }));
    }));
  }

  saveSelection() {
    const cursorPositions = this.jodit.editor.selection.save();
    if (cursorPositions.length > 0) {
      this.lastCursorPosition = cursorPositions[0];
    }
  }

  restoreSelection() {
    this.jodit.editor.selection.restore([this.lastCursorPosition]);
  }

  /**
   * updates the raw text of the editor
   */
  updateTextField() {
    this._rawText = this.tidyUpRaw(this.getRawText());
    // jQuery(this.transcrEditor.nativeElement).find('.note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
  }

  public getSegmentByCaretPos(caretpos: number): number {
    let rawtext = this.getRawText();

    const regex2 = /{([0-9]+)}/g;

    for (const marker of this.markers) {
      const replaceFunc = (x, g1, g2, g3) => {
        const s1 = (g1) ? g1 : '';
        const s3 = (g3) ? g3 : '';
        return s1 + 'X' + s3;
      };

      const regex = new RegExp('(\\s)*(' + escapeRegex(marker.code) + ')(\\s)*', 'g');

      rawtext = rawtext.replace(regex, replaceFunc);
    }

    const segTexts = rawtext.split(regex2).filter(a => !isNumeric(a));

    let start = 0;

    if (segTexts.length > 1) {
      if (caretpos === 0) {
        return 0;
      } else if (caretpos >= rawtext.replace(/\s?{([0-9]+)}\s?/g, ' ').length) {
        return segTexts.length - 1;
      }

      for (let i = 0; i < segTexts.length; i++) {
        const text = segTexts[i];
        if (start >= caretpos) {
          return Math.max(0, i - 1);
        }
        start += text.length - 1;
      }

      if (start >= caretpos) {
        return segTexts.length - 1;
      }

    }

    return -1;
  }

  public validate() {
    if (this.validationEnabled) {
      if (!this.isValidating) {
        this.isValidating = true;
        this.lockHighlighting = true;
        this.saveSelection();
        this._rawText = this.getRawText(false);

        const focusAtEnd = this.lastCursorPosition === undefined;
        if (this._rawText !== '') {
          let code = this._rawText;
          // insert selection placeholders
          if (!focusAtEnd) {
            const startMarker = '[[[sel-start]]][[[/sel-start]]]';
            const endMarker = '[[[sel-end]]][[[/sel-end]]]';
            code = (this.lastCursorPosition.endMarker !== undefined) ? insertString(this._rawText, this._textSelection.end, endMarker) : this._rawText;
            code = insertString(code, this._textSelection.start, startMarker);
          }

          code = this.transcrService.underlineTextRed(code, this.transcrService.validate(code));
          code = this.transcrService.rawToHTML(code);

          if (!focusAtEnd) {
            code = code.replace(/([\s ]+)(<sel-start><\/sel-start><sel-end><\/sel-end><\/p>)?$/g, '&nbsp;$2');
            code = code.replace(/<sel-start><\/sel-start>/g, this.lastCursorPosition.startMarker);
            code = code.replace(/<sel-end><\/sel-end>/g, (this.lastCursorPosition.endMarker) ? this.lastCursorPosition.endMarker : '');
          }

          this._rawText = this.tidyUpRaw(this._rawText);
          this.wisiwyg.innerHTML = code;
          if (focusAtEnd) {
            this.placeAtEnd(this.wisiwyg.firstChild);
          } else {
            this.restoreSelection();
          }

          this.lastHighlightedSegment--;
        }
        this.lockHighlighting = false;
        this.isValidating = false;
        this.validationFinish.emit();
      }
    } else {
      this._rawText = this.getRawText(false);
      this._rawText = this.tidyUpRaw(this._rawText);
    }
  }

  public updateRawText() {
    this._rawText = this.tidyUpRaw(this.getRawText());
  }

  public changeValidationPopoverLocation(x: number, y: number) {
    this.popoversNew.validation.location.x = x;
    this.popoversNew.validation.location.y = y;
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.size.height = this.transcrEditor.nativeElement.offsetHeight;
    this.size.width = this.transcrEditor.nativeElement.offsetWidth;
  }

  public onASROverlayClick() {
    if (this.asrService.selectedLanguage !== undefined) {
      const item = this.asrService.queue.getItemByTime(this.audiochunk.time.start.samples, this.audiochunk.time.duration.samples);
      if (item !== undefined) {
        this.asrService.stopASROfItem(item);
        const segIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
          this.audioManager.createSampleUnit(item.time.sampleStart + 1));
        const segment = this.transcrService.currentlevel.segments.get(segIndex);
        segment.isBlockedBy = undefined;
        this.transcrService.currentlevel.segments.change(segIndex, segment);
      }
    } else {
      console.error(`could not stop ASR because segment number was not found.`);
    }
  }

  public startRecurringHighlight() {
    if (this.highlightingRunning) {
      this.subscrmanager.removeByTag('highlight');
      this.lockHighlighting = false;
    }
    if (this._highlightingEnabled && this._settings.highlightingEnabled) {
      this.highlightingRunning = true;

      const highlight = () => {
        if (this.highlightingRunning) {
          if (!this.lockHighlighting) {
            this.highlightCurrentSegment(this.audiochunk.absolutePlayposition);
          }
          this.subscrmanager.add(timer(100).subscribe(() => {
            highlight();
          }), 'highlight');
        } else {
          this.removeHighlight();
        }
      };
      highlight();
    }
  }

  public stopRecurringHighlight() {
    this.highlightingRunning = false;
    this.lastHighlightedSegment = -1;
  }

  public highlightCurrentSegment(playPosition: SampleUnit) {
    /* TODO not working, repair
    if (playPosition.samples === 0) {
      playPosition = this.audioManager.createSampleUnit(1);
    }
    const segIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(playPosition);

    if (segIndex > -1 && segIndex !== this.lastHighlightedSegment) {
      //this.saveSelection();
      const segment = this.transcrService.currentlevel.segments.get(segIndex);

      this.removeHighlight();

      let dom = findElements(this.wisiwyg, 'p');
      if (dom.length === 0) {
        dom = [this.wisiwyg];
      }

      let currentSegIndex = 0;
      let puffer = document.createElement('span');
      puffer.setAttribute('class', 'highlighted');

      const parentElement: HTMLElement = dom[0];
      const domCopy = dom[0].cloneNode(true) as HTMLElement;

      let j = 0;
      domCopy.childNodes.forEach((elem: HTMLElement, i) => {
        const domElement = parentElement.childNodes.item(j);
        if (elem !== undefined) {
          const tagName = elem.tagName;
          const tagContent = (elem.tagName) ? elem.innerHTML : elem.nodeValue;
          const addElemToPuffer = () => {
            if (currentSegIndex === segIndex && elem !== undefined) {
              domElement.remove();
              puffer.appendChild(domElement);
              j--;
            }
          };

          if (tagName !== undefined) {
            if (tagName.toLowerCase() === 'img') {
              const dataSamples = getAttr(elem, 'data-samples');
              if (dataSamples !== undefined) {
                const segSamples = Number(dataSamples);
                const foundSegment = segment.time.samples;

                if (segSamples === foundSegment) {
                  if (puffer.childNodes.length > 0) {
                    domElement.parentNode.insertBefore(puffer, domElement);
                  }
                  this.lastHighlightedSegment = currentSegIndex;
                  puffer = document.createElement('span');
                  return;
                } else {
                  puffer = document.createElement('span');
                  puffer.setAttribute('class', 'highlighted');
                  currentSegIndex++;
                }
              } else {
                addElemToPuffer();
              }
            } else {
              addElemToPuffer();
            }
          } else {
            addElemToPuffer();
          }
        } else {
          console.error(`elem is undefined! puffer: ${jQuery(puffer).text()}`);
        }
        j++;
      });

      const pufferText = puffer.outerHTML;
      if (puffer.childNodes.length > 0) {
        // puffer not added, last segment
        parentElement.appendChild(puffer);
        const parentText = parentElement.outerHTML;
        this.lastHighlightedSegment = currentSegIndex;
        // this.restoreSelection();
        // this.initPopover();
      }
    }
    */
  }

  public waitForValidationFinished(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.validationEnabled) {
        if (this.isValidating) {
          this.subscrmanager.add(this.validationFinish.subscribe(() => {
            resolve();
          }));
        } else {
          resolve();
        }
      } else {
        resolve();
      }
    });
  }

  private isMarker(shortcut) {
    if (this.markers !== undefined) {
      const platform = BrowserInfo.platform;
      return (this.markers.findIndex(a => a.shortcut[platform] === shortcut) > -1 || (shortcut === 'ALT + S' && this.Settings.specialMarkers.boundary));
    }

    return false;
  }

  private createBoundaryButton() {
    let content = '';
    // create boudary button
    const boundaryLabel = this.langService.translate('special_markers.boundary.insert', {type: ''});
    const boundaryDescr = this.langService.translate('special_markers.boundary.description', {type: ''});

    if (!this.easymode) {
      content = `<img src='assets/img/components/transcr-editor/boundary.png' class='btn-icon' alt='boundary_img'/> ` +
        `<span class='btn-description'>${boundaryLabel}</span><span class='btn-shortcut'> ` +
        `[ALT + S]</span>`;
      if (this.Settings.responsive) {
        content = `<img src='assets/img/components/transcr-editor/boundary.png' class='btn-icon' alt='boundary_img'/> ` +
          `<span class='btn-description d-none d-md-inline'>${boundaryLabel}</span>` +
          `<span class='btn-shortcut d-none d-lg-inline'> ` +
          `[ALT + S]</span>`;
      }
    } else {
      content = `<img src='assets/img/components/transcr-editor/boundary.png' class='btn-icon' alt='boundary_img'/>`;
    }

    return this.createButton('boundary', boundaryDescr, content, () => {
      this.markerClick.emit('boundary');
      this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
    });
  }

  private setTranscript(rawText: string) {
    this._rawText = this.tidyUpRaw(rawText);

    // set cursor at the end after focus
    this.init = 0;

    this.jodit.editor.value = this.transcrService.rawToHTML(rawText);
    this.validate();
    this.initPopover();

    this.asr = {
      status: 'inactive',
      result: '',
      error: ''
    };
  }

  private setSegments(segments: Segments) {
    let result = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments.get(i);
      result += seg.transcript;

      if (i < segments.length - 1) {
        result += `{${segments.get(i).time.samples}}`;
      }
    }

    this.setTranscript(result);
  }

  private triggerTyping() {
    // this.highlightingRunning = false;
    this.subscrmanager.add(timer(500).subscribe(() => {
      if (Date.now() - this.lastkeypress >= 450 && this.lastkeypress > -1) {
        if (this._isTyping) {
          if (this.audiochunk.id === this._lastAudioChunkID) {
            this._isTyping = false;
            this.internalTyping.emit('stopped');

            this.lastkeypress = -1;
          } else {
            // ignore typing stop after audioChunk was changed
            this._lastAudioChunkID = this.audiochunk.id;
          }
        }
      }
    }));

    if (!this._isTyping) {
      this.internalTyping.emit('started');
    }
    this._isTyping = true;
    this.lastkeypress = Date.now();
  }

  /**
   * destroys the summernote editor
   */
  private destroy() {
    // delete tooltip overlays
    this.subscrmanager.destroy();
  }

  /**
   * tidy up the raw text, remove white spaces etc.
   */
  private tidyUpRaw(raw: string): string {
    return tidyUpAnnotation(raw, this.transcrService.guidelines);
  }

  private onSegmentBoundaryOver = (event) => {
    if (!(getAttr(event.target, 'data-samples') === undefined || getAttr(event.target, 'data-samples') === undefined)) {
      this.onSegmentBoundaryMouseOver(event);
    } else if (!(getAttr(event.target, 'data-errorcode') === undefined || getAttr(event.target, 'data-errorcode') === undefined)) {
      this.onValidationErrorMouseOver(event);
    }
  }

  private onSegmentBoundaryMouseOver(event: MouseEvent) {
    const target = (event.target as HTMLElement);
    const segPopovers = this.transcrEditor.nativeElement.querySelector('.seg-popover');
    const segPopover = segPopovers[0];

    if (segPopover !== undefined) {
      const width = segPopover.offsetWidth;
      const height = segPopover.offsetHeight;
      const editorPos = this.workplace.offset;
      const segSamples = getAttr(target, 'data-samples');

      if (segSamples !== undefined && isNumber(segSamples)) {
        const samples = Number(segSamples);
        const time = new SampleUnit(samples, this.audioManager.sampleRate);
        const marginLeft = (target.offsetLeft - (width / 2)) + 'px';
        const marginTop = (this.workplace.offsetTop - editorPos.top - height - 10) + 'px';

        segPopover.css({
          'margin-left': marginLeft,
          'margin-top': marginTop,
          'z-index': 30,
          position: 'absolute',
          'background-color': 'white',
          display: 'inherit'
        });

        target.style.cursor = 'pointer';

        const timespan = new TimespanPipe();
        const text = timespan.transform(time.unix, {
          showHour: true,
          showMilliSeconds: true,
          maxDuration: this.audiochunk.time.duration.unix
        });
        segPopover.text(text);
      }
    }
  }

  private onValidationErrorMouseOver = (event: MouseEvent) => {
    let target: HTMLElement = event.target as HTMLElement;
    if (getAttr(event.target as HTMLElement, 'data-errorcode') === undefined) {
      target = (event.target as HTMLElement).parentNode as HTMLElement;
    }

    const errorCode = getAttr(target, 'data-errorcode');

    if (errorCode !== undefined) {
      const errorDetails = this.transcrService.getErrorDetails(errorCode);

      if (errorDetails !== undefined) {
        // set values
        this.validationPopover.show();
        this.cd.markForCheck();
        this.cd.detectChanges();
        this.validationPopover.description = errorDetails.description;
        this.validationPopover.title = errorDetails.title;
        this.cd.markForCheck();
        this.cd.detectChanges();

        let marginLeft = target.offsetLeft;
        const height = this.validationPopover.height;

        console.dir();
        if (
          this.validationPopover.width + marginLeft > this.wisiwyg.offsetWidth
          && marginLeft - this.validationPopover.width > 0
        ) {
          marginLeft -= this.validationPopover.width;

          if (target.offsetWidth > 10) {
            marginLeft += 10;
          }
        }

        this.changeValidationPopoverLocation(marginLeft, target.offsetTop - height + this.toolbar.offsetHeight);
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
    } else {
      console.error(`errorcode is undefined!`);
    }
  }

  private removeHighlight() {
    const highlights = findElements(this.transcrEditor.nativeElement, '.highlighted');
    for (const highlight of highlights) {
      if (highlight.parentNode !== null) {
        const highlightChilds = findElements(highlight, '*');
        for (const highlightChild of highlightChilds) {
          highlightChild.remove();
          highlight.parentNode.insertBefore(highlightChild, highlight);
        }
        highlight.remove();
      } else {
        console.error(`item parent is undefined!`);
      }
    }
  }

  private onValidationErrorMouseLeave = () => {
    this.validationPopover.hide();
  }

  private initializeShortcuts() {
    this.shortcuts.items = [];
    this.shortcuts.items.push(
      {
        name: 'add-boundary',
        keys: {
          mac: 'ALT + S',
          pc: 'ALT + S'
        },
        title: 'add boundary',
        focusonly: true
      }
    );

    for (const marker of this.markers) {
      this.shortcuts.items.push(
        {
          name: marker.name,
          keys: marker.shortcut,
          focusonly: true,
          title: marker.button_text
        }
      )
    }
  }

  placeAtEnd(element: HTMLElement) {
    this.jodit.editor.selection.setCursorAfter(element.lastChild);
  }
}
