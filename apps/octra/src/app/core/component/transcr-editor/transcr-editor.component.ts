import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {TranslocoService} from '@ngneat/transloco';
import {KeyMapping, TimespanPipe} from '@octra/components';
import {isNumeric} from 'rxjs/internal-compatibility';
import {timer} from 'rxjs';

import {BrowserInfo} from '../../shared';
import {TranscriptionService} from '../../shared/service';
import {ASRProcessStatus, ASRQueueItem, AsrService} from '../../shared/service/asr.service';
import {TranscrEditorConfig} from './config';
import {ValidationPopoverComponent} from './validation-popover/validation-popover.component';
import {Functions, isUnset, SubscriptionManager} from '@octra/utilities';
import {AudioChunk, AudioManager, SampleUnit} from '@octra/media';
import {Segments} from '@octra/annotation';

/// <reference path="../../../../../../node_modules/@types/summernote/index.d.ts" />
declare var tidyUpAnnotation: ((string, any) => any);

declare let document: any;

@Component({
  selector: 'octra-transcr-editor',
  templateUrl: './transcr-editor.component.html',
  styleUrls: ['./transcr-editor.component.css'],
  providers: [TranscrEditorConfig]
})
export class TranscrEditorComponent implements OnInit, OnDestroy, OnChanges {
  @Output() loaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onkeyup: EventEmitter<any> = new EventEmitter<any>();
  @Output() markerInsert: EventEmitter<string> = new EventEmitter<string>();
  @Output() markerClick: EventEmitter<string> = new EventEmitter<string>();
  @Output() typing: EventEmitter<string> = new EventEmitter<string>();
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
  @ViewChild('validationPopover', {static: true}) validationPopover: ValidationPopoverComponent;
  @ViewChild('transcrEditor', {static: true}) transcrEditor: ElementRef;
  public textfield: any = null;
  public focused = false;
  public asr = {
    status: 'inactive',
    result: '',
    error: ''
  };
  size = {
    height: 100,
    width: 100
  };
  public popovers = {
    segmentBoundary: null,
    validationError: null
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
  private _lastAudioChunkID = -1;
  private _settings: TranscrEditorConfig;
  private subscrmanager: SubscriptionManager;
  private init = 0;
  private summernoteUI: any = null;
  private lastkeypress = 0;

  private highlightingRunning = false;
  private lockHighlighting = false;
  private lastHighlightedSegment = -1;

  private _highlightingEnabled = true;
  @Output() highlightingEnabledChange = new EventEmitter();

  @Input() get highlightingEnabled() {
    return this._highlightingEnabled;
  }

  set highlightingEnabled(value: boolean) {
    this._highlightingEnabled = (!isUnset(value)) ? value : true;
    this.highlightingEnabledChange.emit(value);
  }

  public get summernote() {
    return this.textfield.summernote;
  }

  public get caretpos(): number {
    if (!this.focused) {
      return -1;
    }
    // @ts-ignore
    return jQuery('.note-editable:eq(0)').caret('pos');
  }

  get audioManager(): AudioManager {
    return this.audiochunk.audioManager;
  }

  set segments(segments: Segments) {
    let result = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments.get(i);
      result += seg.transcript;

      if (i < segments.length - 1) {
        result += `{${segments.get(i).time.samples}}`;
      }
    }

    jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
    this.rawText = result;
  }

  get Settings(): TranscrEditorConfig {
    return this._settings;
  }

  set Settings(value: TranscrEditorConfig) {
    this._settings = value;
  }

  get html(): string {
    return (this.textfield) ? this.textfield.summernote('code') : '';
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

  set rawText(value: string) {
    jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
    this._rawText = this.tidyUpRaw(value);

    if (!isUnset(this.textfield)) {
      this.init = 0;
      const html = this.transcrService.rawToHTML(value);
      this.textfield.summernote('code', html);
      this.validate();
      this.initPopover();
    }
    this.asr = {
      status: 'inactive',
      result: '',
      error: ''
    };
  }

  constructor(private cd: ChangeDetectorRef,
              private langService: TranslocoService,
              private transcrService: TranscriptionService,
              private asrService: AsrService) {

    this._settings = new TranscrEditorConfig();
    this.subscrmanager = new SubscriptionManager();
  }

  /**
   * converts the editor's html text to raw text
   */
  getRawText = (replaceEmptySpaces = true) => {
    let html = this.textfield.summernote('code');

    html = html.replace(/<((p)|(\s?\/p))>/g, '');
    html = html.replace(/&nbsp;/g, ' ');

    // check for markers that are utf8 symbols
    for (const marker of this.markers) {
      if (!isUnset(marker.icon) && marker.icon.indexOf('.png') < 0 && marker.icon.indexOf('.jpg') < 0 && marker.icon.indexOf('.gif') < 0
        && marker.icon !== '' && marker.code !== '' && marker.icon !== marker.code
      ) {
        // replace all utf8 symbols with the marker's code
        html = html.replace(new RegExp(marker.icon, 'g'), marker.code);
      }
    }

    html = this.transcrService.replaceSingleTags(html);

    html = `<p>${html}</p>`;
    const dom = jQuery(html);

    let charCounter = 0;

    const textSelection = {
      start: -1,
      end: -1
    };

    jQuery(dom).find('span.highlighted').each((j, domElement) => {
      if (!isUnset(jQuery(domElement).parent())) {
        jQuery(domElement).contents().each((k, node) => {
          jQuery(node).remove();
          jQuery(domElement).before(node);
        });
        jQuery(domElement).remove();
      } else {
        console.error(`item parent is null!`);
      }
    });

    const replaceFunc = (i, elem) => {
      const tagName = jQuery(elem).prop('tagName');
      if (jQuery(elem).contents() !== null && jQuery(elem).contents().length > 0) {
        jQuery.each(jQuery(elem).contents(), replaceFunc);
      } else {
        let attr = jQuery(elem).attr('data-marker-code');
        if (elem.type === 'select-one') {
          const value = jQuery(elem).attr('data-value');
          attr += '=' + value;
        }
        if (attr) {
          const markerCode = Functions.unEscapeHtml(attr);

          for (const marker of this.markers) {
            if (markerCode === marker.code) {
              jQuery(elem).replaceWith(Functions.escapeHtml(markerCode));
              charCounter += markerCode.length;
              break;
            }
          }
        } else if (elem.nodeType === 3) {
          // is textNode
          const text = jQuery(elem).text();
          charCounter += text.length;
          jQuery(elem).text(text);
        } else if (tagName.toLowerCase() === 'img') {
          if (!(jQuery(elem).attr('data-samples') === null || jQuery(elem).attr('data-samples') === undefined)) {
            // TODO check if this is working
            const boundaryText = `{${jQuery(elem).attr('data-samples')}}`;
            const textnode = document.createTextNode(boundaryText);
            jQuery(elem).before(textnode);
            jQuery(elem).remove();
            charCounter += boundaryText.length;
          }
        } else if (
          jQuery(elem).attr('class') === 'val-error'
          && tagName.toLowerCase() !== 'textspan'
        ) {
          jQuery(elem).remove();
        } else if (
          tagName.toLowerCase() === 'span'
        ) {
          const elemText = jQuery(elem).text();
          const textnode = document.createTextNode(elemText);
          jQuery(elem).before(textnode);
          jQuery(elem).remove();
          charCounter += elemText.length;
        } else if (tagName.toLowerCase() === 'sel-start') {
          // save start selection
          textSelection.start = charCounter;
        } else if (tagName.toLowerCase() === 'sel-end') {
          // save start selection
          textSelection.end = charCounter;
        }
      }
    };

    if (textSelection.start === -1 || textSelection.end === -1) {
      textSelection.start = 0;
      textSelection.end = 0;
    }

    this._textSelection = textSelection;

    jQuery.each(dom, replaceFunc);

    let rawText = jQuery(dom).text();

    if (replaceEmptySpaces) {
      rawText = rawText.replace(/[\s ]+/g, ' ');
    }

    return rawText;
  }
  /**
   * initializes the editor and the containing summernote editor
   */
  public initialize = () => {
    if (!isUnset(this.audiochunk)) {

      // @ts-ignore
      this.summernoteUI = jQuery.summernote.ui;
      const navigation = this.initNavigation();

      if (this.Settings.specialMarkers.boundary) {
        const customArray = this.createCustomButtonsArray();
        navigation.buttons.boundary = customArray[0];
        navigation.str_array.push('boundary');
        if (this._settings.highlightingEnabled) {
          navigation.buttons.highlighting = customArray[3];
          navigation.str_array.push('highlighting');
        }
      }

      if (!isUnset(this.textfield)) {
        this.textfield.summernote('destroy');
      }

      this.textfield = jQuery('.textfield');
      this.textfield.summernote({
        height: this.Settings.height,
        focus: false,
        disableDragAndDrop: true,
        disableResizeEditor: true,
        disableResizeImage: true,
        popover: {
          image: [],
          link: [],
          air: []
        },
        airPopover: [],
        toolbar: [
          ['default', navigation.str_array]
        ],
        shortcuts: false,
        buttons: navigation.buttons,
        callbacks: {
          onKeydown: this.onKeyDownSummernote,
          onKeyup: this.onKeyUpSummernote,
          onPaste: (e) => {
            e.preventDefault();
            const bufferText = ((e.originalEvent || e).clipboardData || (window as any).clipboardData).getData('Text');
            let html = bufferText.replace(/(<p>)|(<\/p>)/g, '')
              .replace(new RegExp('\\\[\\\|', 'g'), '{').replace(new RegExp('\\\|\]', 'g'), '}');
            html = Functions.unEscapeHtml(html);
            html = '<span>' + this.transcrService.rawToHTML(html) + '</span>';
            html = html.replace(/(<p>)|(<\/p>)|(<br\/?>)/g, '');
            const htmlObj = jQuery(html);
            if (!(this.rawText === null || this.rawText === undefined) && this._rawText !== '') {
              this.textfield.summernote('editor.insertNode', htmlObj[0]);
            } else {
              this.textfield.summernote('code', html);
              this.focus(true);
            }
            this.updateTextField();
            this.initPopover();
          },
          onChange: () => {
            this.init++;

            if (this.init === 1) {
              this.focus(true);
            } else if (this.init > 1) {
              // this.restoreSelection();
            }
          },
          onBlur: () => {
            this.focused = false;
          },
          onFocus: () => {
            this.focused = true;
          },
          onMouseup: () => {
            this.selectionchanged.emit(this.caretpos);
          }
        }
      });

      this.textfield.summernote('removeModule', 'statusbar');
      this.textfield.summernote('removeModule', 'handle');
      this.textfield.summernote('removeModule', 'hintPopover');
      this.textfield.summernote('removeModule', 'imageDialog');
      this.textfield.summernote('removeModule', 'airPopover');

      // create seg popover

      this.popovers.segmentBoundary = jQuery('<div></div>')
        .addClass('panel')
        .addClass('seg-popover')
        .html('00:00:000');

      this.popovers.segmentBoundary.insertBefore('.note-editing-area');

      this.popovers.validationError = jQuery('<div></div>')
        .addClass('card error-card')
        .html(`
      <div class="card-header" style="padding:5px 10px; font-weight: bold;background-color:whitesmoke;">
      <span style="color:red;">( ! )</span> <span class="error-title"></span></div>
      <div class="card-body" style="padding:5px 10px;"></div>
      `)
        .css({
          'max-width': '500px',
          position: 'absolute',
          'margin-top': '0px',
          'z-index': '200',
          display: 'none'
        });

      this.popovers.validationError.insertBefore('.note-editing-area');

      jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
      this.rawText = this._rawText;
      this.loaded.emit(true);

      this.asr.status = 'inactive';
      this.asr.error = '';
      this.asr.result = '';

      const item = this.asrService.queue.getItemByTime(this.audiochunk.time.start.samples,
        this.audiochunk.time.duration.samples);

      this.onASRItemChange(item);
      this.size.height = jQuery(this.transcrEditor.nativeElement).height();
      this.size.width = jQuery(this.transcrEditor.nativeElement).width();

      if (this._settings.highlightingEnabled) {
        this.startRecurringHighlight();
      }
    }
  }

  onASRItemChange(item: ASRQueueItem) {
    if (!isUnset(item)) {
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
    if ((icon === null || icon === undefined) || icon === '') {
      // text only
      this.textfield.summernote('editor.insertText', markerCode + ' ');
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

        this.textfield.summernote('editor.insertNode', element);
      } else {
        this.textfield.summernote('editor.insertText', icon);
      }

    }
    this.triggerTyping();
  }

  /**
   * called when key pressed in editor
   */
  onKeyDownSummernote = ($event) => {
    const comboKey = KeyMapping.getShortcutCombination($event);
    const platform = BrowserInfo.platform;

    if (comboKey !== '') {
      if (this.isDisabledKey(comboKey)) {
        $event.preventDefault();
      } else {
        if (comboKey === 'ALT + S' && this.Settings.specialMarkers.boundary) {
          // add boundary
          $event.preventDefault();
          this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
          this.boundaryinserted.emit(this.audiochunk.absolutePlayposition.samples);
          return;
        } else {
          for (const marker of this.markers) {
            if (marker.shortcut[platform] === comboKey) {
              $event.preventDefault();
              this.insertMarker(marker.code, marker.icon);
              this.markerInsert.emit(marker.name);
              return;
            }
          }
        }
      }
    }
  }
  /**
   * called after key up in editor
   */
  onKeyUpSummernote = ($event) => {
    // update rawText
    this.onkeyup.emit($event);
    this.triggerTyping();
  }

  /**
   * set focus to the very last position of the editors text
   */
  public focus = (later: boolean = false) => {
    const func = () => {
      try {
        if (this.rawText !== '' && this.html !== '<p><br/></p>') {
          if (this.html.indexOf('<p>') === 0) {
            Functions.placeAtEnd(jQuery('.note-editable').find('p')[0]);
          } else {
            Functions.placeAtEnd(jQuery('.note-editable')[0]);
          }
        }
        if (!isUnset(this.textfield)) {
          this.textfield.summernote('focus');
        }
      } catch (exception) {
        // ignore errors
        console.error(exception);
      }
    };

    if (later) {
      setTimeout(
        () => {
          func();
        }, 300
      );
    } else {
      func();
    }
  }

  ngOnInit() {
    this.Settings.height = this.height;
    if (!isUnset(this.audiochunk)) {
      this._lastAudioChunkID = this.audiochunk.id;
    }
    this.initialize();

    this.subscrmanager.add(this.asrService.queue.itemChange.subscribe((item: ASRQueueItem) => {
        this.onASRItemChange(item);
      },
      (error) => {
        console.error(error);
      },
      () => {
      }));
  }

  ngOnChanges(obj) {
    let renew = false;
    if (!(obj.markers === null || obj.markers === undefined) && obj.markers.previousValue !== obj.markers.currentValue) {
      renew = true;
    }
    if (!(obj.easymode === null || obj.easymode === undefined) && obj.easymode.previousValue !== obj.easymode.currentValue) {
      renew = true;
    }
    if (!isUnset(obj.audiochunk) && !isUnset(obj.audiochunk.currentValue)) {
      renew = true;
    }

    if (renew) {
      if (!isUnset(this.textfield)) {
        this.textfield.summernote('destroy');
      }
      this.initialize();
      this.initPopover();
    }
  }

  ngOnDestroy() {
    this.destroy();
    jQuery('.note-editable.panel-body img').off('click');
  }

  public update() {
    this.destroy();
    this.initialize();
    this.cd.detectChanges();
  }

  /**
   * initializes the navbar bar of the editor
   */
  initNavigation() {
    const result = {
      buttons: {
        boundary: undefined,
        highlighting: undefined
      },
      str_array: []
    };

    if (!(this.markers === null || this.markers === undefined)) {
      for (let i = 0; i < this.markers.length; i++) {
        const marker = this.markers[i];
        result.buttons['' + i + ''] = this.createButton(marker);
        result.str_array.push('' + i + '');
      }
    }
    return result;
  }

  /**
   * creates a marker button for the toolbar
   */
  createButton(marker): any {
    return () => {
      const platform = BrowserInfo.platform;
      let icon;
      if ((marker.icon === null || marker.icon === undefined) || marker.icon === '' ||
        marker.icon.indexOf('.png') < 0 && marker.icon.indexOf('.jpg') < 0) {
        // text only or utf8 symbol
        icon = (!isUnset(marker.icon) && (marker.icon.indexOf('.png') < 0 || marker.icon.indexOf('.jpg') < 0)) ? marker.icon : '';

        if (!this.easymode) {
          icon += `${marker.button_text}<span class='btn-shortcut'> ` +
            `[${marker.shortcut[platform]}]</span>`;
          if (this.Settings.responsive) {
            icon = `${marker.button_text}<span class='btn-shortcut d-none d-lg-inline'> ` +
              `[${marker.shortcut[platform]}]</span>`;
          }
        } else {
          icon += ' ' + marker.button_text;
        }
      } else {
        if (!this.easymode) {
          icon = `<img src='${marker.icon}' class='btn-icon' alt='${marker.button_text}'/>` +
            `<span class='btn-description'> ${marker.button_text}</span><span class='btn-shortcut'> ` +
            `[${marker.shortcut[platform]}]</span>`;
          if (this.Settings.responsive) {
            icon = `<img src='${marker.icon}' class='btn-icon' alt='${marker.button_text}'/>` +
              `<span class='btn-description d-none d-lg-inline'> ${marker.button_text}` +
              `</span><span class='btn-shortcut d-none d-lg-inline'> [${marker.shortcut[platform]}]</span>`;
          }
        } else {
          icon = `<img src='${marker.icon}' class='btn-icon' alt='${marker.button_text}'/>`;
        }
      }
      // create button
      const btnJS = {
        contents: icon,
        tooltip: (isUnset(this.Settings) || this.Settings.btnPopover) ? marker.description : '',
        container: false,
        click: () => {
          // invoke insertText method with 'hello' on editor module.
          this.insertMarker(marker.code, marker.icon);
          this.validate();
          this.markerClick.emit(marker.name);
          this.initPopover();
        }
      };
      // @ts-ignore
      const button = jQuery.summernote.ui.button(btnJS);

      return button.render();   // return button as jquery object
    };
  }

  initPopover() {
    if (!isUnset(this.popovers.validationError)) {
      this.popovers.validationError.css('display', 'none');
      this.popovers.segmentBoundary.css('display', 'none');
    }

    // set popover for boundaries
    jQuery('.btn-icon-text[data-samples]')
      .off('click')
      .off('mouseover')
      .off('mouseleave');

    setTimeout(() => {
      jQuery('.btn-icon-text[data-samples]')
        .on('click', (event) => {
          const jqueryobj = jQuery(event.target);
          const samples = jqueryobj.attr('data-samples');

          if (isNumeric(samples)) {
            this.boundaryclicked.emit(new SampleUnit(Number(samples), this.audioManager.sampleRate));
          }
        })
        .on('mouseover', (event) => {
          this.onSegmentBoundaryMouseOver(jQuery(event.target), event);
        })
        .on('mouseleave', () => {
          jQuery('.seg-popover').css({
            display: 'none'
          });
        });
    }, 200);

    // set popover for errors
    const valError = jQuery('.val-error');
    valError.off('mouseenter')
      .off('mouseleave');

    valError.children()
      .off('mouseenter')
      .off('mouseleave');

    setTimeout(() => {
      valError
        .on('mouseenter', (event) => {
          this.onValidationErrorMouseOver(jQuery(event.target), event);
        })
        .on('mouseleave', () => {
          this.onValidationErrorMouseLeave();
        });

      jQuery('.val-error').children()
        .on('mouseenter', (event) => {
          this.onValidationErrorMouseOver(jQuery(event.target), event);
        })
        .on('mouseleave', () => {
          this.onValidationErrorMouseLeave();
        });
    }, 200);
  }

  createCustomButtonsArray(): any[] {
    const result: any[] = [];

    // create boundary button
    const boundaryBtn = () => {
      const boundaryLabel = this.langService.translate('special_markers.boundary.insert', {type: ''});
      const boundaryDescr = this.langService.translate('special_markers.boundary.description', {type: ''});
      let icon;
      if (!this.easymode) {
        icon = `<img src='assets/img/components/transcr-editor/boundary.png' class='btn-icon' alt='boundary_img'/> ` +
          `<span class='btn-description'>${boundaryLabel}</span><span class='btn-shortcut'> ` +
          `[ALT + S]</span>`;
        if (this.Settings.responsive) {
          icon = `<img src='assets/img/components/transcr-editor/boundary.png' class='btn-icon' alt='boundary_img'/> ` +
            `<span class='btn-description d-none d-md-inline'>${boundaryLabel}</span>` +
            `<span class='btn-shortcut d-none d-lg-inline'> ` +
            `[ALT + S]</span>`;
        }
      } else {
        icon = `<img src='assets/img/components/transcr-editor/boundary.png' class='btn-icon' alt='boundary_img'/>`;
      }
      // create button
      const btnJS = {
        contents: icon,
        tooltip: boundaryDescr,
        container: false,
        click: () => {
          this.markerClick.emit('boundary');
          this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
        }
      };
      // @ts-ignore
      const button = jQuery.summernote.ui.button(btnJS);

      return button.render();   // return button as jquery object
    };

    result.push(boundaryBtn);

    // create boundary button
    const highlightingButton = () => {
      const icon = (this.highlightingEnabled) ? `<img src='assets/img/components/transcr-editor/highlightingEnabled.jpg'
 class='btn-icon highlight-button' style='height:15px;'/>`
        : `<img src='assets/img/components/transcr-editor/highlightingDisbled.jpg'
 class='btn-icon highlight-button' style='height:15px;'/>`;
      // create button
      const btnJS = {
        contents: icon,
        tooltip: 'enable highlighting',
        container: false,
        click: () => {
          if (this._highlightingEnabled) {
            this.stopRecurringHighlight();
            this.highlightingEnabled = false;
            jQuery('.highlight-button').attr('src', 'assets/img/components/transcr-editor/highlightingDisbled.jpg');
          } else {
            this.highlightingEnabled = true;
            jQuery('.highlight-button').attr('src', 'assets/img/components/transcr-editor/highlightingEnabled.jpg');
            this.startRecurringHighlight();
          }
        }
      };
      // @ts-ignore
      const button = jQuery.summernote.ui.button(btnJS);

      return button.render();   // return button as jquery object
    };

    result.push(highlightingButton);

    return result;
  }

  insertBoundary(imgURL: string) {
    const element = document.createElement('img');
    element.setAttribute('src', imgURL);
    element.setAttribute('class', 'btn-icon-text boundary');
    element.setAttribute('data-samples', this.audiochunk.absolutePlayposition.samples.toString());
    element.setAttribute('alt', '[|' + this.audiochunk.absolutePlayposition.samples.toString() + '|]');

    this.textfield.summernote('editor.insertText', ' ');
    this.triggerTyping();

    // timeout needed to fix summernote
    setTimeout(() => {
      this.textfield.summernote('editor.insertNode', element);
      this.textfield.summernote('editor.insertText', ' ');

      // set popover
      setTimeout(() => {
        jQuery(element).on('click', (event) => {
          const jqueryobj = jQuery(event.target);
          const samples = jqueryobj.attr('data-samples');

          if (isNumeric(samples)) {
            this.boundaryclicked.emit(new SampleUnit(Number(samples), this.audioManager.sampleRate));
          }
        })
          .on('mouseover', (event) => {
            this.onTextMouseOver(event);
          })
          .on('mouseleave', () => {
            jQuery('.seg-popover').css({
              display: 'none'
            });
          });
      }, 200);
      this.triggerTyping();
    }, 100);
  }

  saveSelection() {
    let range;

    jQuery('sel-start').remove();
    jQuery('sel-end').remove();

    // @ts-ignore
    range = jQuery.summernote.range;
    const rangeSelection: WrappedRange = range.createFromSelection();

    if (!isUnset(rangeSelection) && this.focused) {
      if (rangeSelection.so === rangeSelection.eo && rangeSelection.sc === rangeSelection.ec) {
        // no selection length
        const teElem = document.createElement('sel-start');
        rangeSelection.collapse();
        rangeSelection.insertNode(document.createElement('sel-end'));
        rangeSelection.insertNode(teElem);
      } else {
        const endRange = rangeSelection.collapse();
        endRange.insertNode(document.createElement('sel-end'));
        const startRange = rangeSelection.collapse(true);
        startRange.insertNode(document.createElement('sel-start'));
      }
    }
  }

  restoreSelection() {
    const elem = document.getElementsByClassName('note-editable')[0];

    if (!isUnset(elem) && elem.getElementsByTagName('sel-start')[0] !== undefined) {
      const range = document.createRange();
      const sel = window.getSelection();
      let selStart = elem.getElementsByTagName('sel-start')[0];
      const selEnd = elem.getElementsByTagName('sel-end')[0];

      const endOffset = 0;

      if (selStart === null) {
        selStart = selEnd;
      }

      if (selStart && selEnd) {
        // set start position
        let lastNodeChildren = selStart.childNodes.length;
        if (selStart.nodeName === '#text') {
          lastNodeChildren = selStart.textContent.length;
        }
        range.setStart(selStart, lastNodeChildren);
        range.setEnd(selEnd, endOffset);

        range.collapse(false);

        sel.removeAllRanges();
        sel.addRange(range);

        // TODO change to specific textfield!
        jQuery('sel-start').remove();
        jQuery('sel-end').remove();
      }
    }
  }

  /**
   * updates the raw text of the editor
   */
  updateTextField() {
    this._rawText = this.tidyUpRaw(this.getRawText());
    jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
  }

  /**
   * adds the comboKey to the list of disabled Keys
   */
  public addDisableKey(comboKey: string): boolean {
    for (const disabledKey of this.Settings.disabledKeys) {
      if (disabledKey === comboKey) {
        return false;
      }
    }
    this.Settings.disabledKeys.push(comboKey);
    return true;
  }

  /**
   * removes the combokey of list of disabled keys
   */
  public removeDisableKey(comboKey: string): boolean {
    let j = -1;
    for (let i = 0; i < this.Settings.disabledKeys.length; i++) {
      if (this.Settings.disabledKeys[i] === comboKey) {
        j = i;
        return true;
      }
    }
    this.Settings.disabledKeys.splice(j, 1);

    return (j > -1);
  }

  public convertEntitiesToString(str: string) {
    return jQuery('<textarea />').html(str).text();
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

      const regex = new RegExp('(\\s)*(' + Functions.escapeRegex(marker.code) + ')(\\s)*', 'g');

      rawtext = rawtext.replace(regex, replaceFunc);
    }

    const segTexts = rawtext.split(regex2).filter((a) => {
      if (!isNumeric(a)) {
        return a;
      }
    });

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
      this.lockHighlighting = true;
      this.saveSelection();
      this._rawText = this.getRawText(false);

      if (this._rawText !== '') {
        // insert selection placeholders
        const startMarker = '[[[sel-start]]][[[/sel-start]]]';
        const endMarker = '[[[sel-end]]][[[/sel-end]]]';
        let code = Functions.insertString(this._rawText, this._textSelection.start, startMarker);
        code = Functions.insertString(code, this._textSelection.end + startMarker.length, endMarker);

        code = this.transcrService.underlineTextRed(code, this.transcrService.validate(code));
        code = this.transcrService.rawToHTML(code);
        code = code.replace(/([\s ]+)(<sel-start><\/sel-start><sel-end><\/sel-end><\/p>)?$/g, '&nbsp;$2');

        this._rawText = this.tidyUpRaw(this._rawText);
        this.textfield.summernote('code', code);
        this.restoreSelection();
        this.lastHighlightedSegment--;
      }
      this.lockHighlighting = false;
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
    this.size.height = jQuery(this.transcrEditor.nativeElement).height();
    this.size.width = jQuery(this.transcrEditor.nativeElement).width();
  }

  public onASROverlayClick() {
    if (!isUnset(this.asrService.selectedLanguage)) {
      const item = this.asrService.queue.getItemByTime(this.audiochunk.time.start.samples, this.audiochunk.time.duration.samples);
      if (!isUnset(item)) {
        this.asrService.stopASROfItem(item);
        const segIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(
          this.audioManager.createSampleUnit(item.time.sampleStart + 1));
        const segment = this.transcrService.currentlevel.segments.get(segIndex);
        segment.isBlockedBy = null;
        this.transcrService.currentlevel.segments.change(segIndex, segment);
      }
    } else {
      console.error(`could not stop ASR because segment number was not found.`);
    }
  }

  private triggerTyping() {
    // this.highlightingRunning = false;
    setTimeout(() => {
      if (Date.now() - this.lastkeypress >= 450 && this.lastkeypress > -1) {
        if (this._isTyping) {
          if (this.audiochunk.id === this._lastAudioChunkID) {
            this._isTyping = false;
            this.typing.emit('stopped');

            this.validate();
            this.initPopover();
            this.lastkeypress = -1;
          } else {
            // ignore typing stop after audioChunk was changed
            this._lastAudioChunkID = this.audiochunk.id;
          }
        }
      }
    }, 500);

    if (!this._isTyping) {
      this.typing.emit('started');
    }
    this._isTyping = true;
    this.lastkeypress = Date.now();
  }

  /**
   * destroys the summernote editor
   */
  private destroy() {
    if (!isUnset(this.textfield)) {
      this.textfield.summernote('destroy');
    }
    // delete tooltip overlays
    jQuery('.tooltip').remove();
    this.subscrmanager.destroy();
  }

  /**
   * checks if the combokey is part of the configs disabledkeys
   */
  private isDisabledKey(comboKey: string): boolean {
    for (const disabledKey of this.Settings.disabledKeys) {
      if (disabledKey === comboKey) {
        return true;
      }
    }
    return false;
  }

  /**
   * tidy up the raw text, remove white spaces etc.
   */
  private tidyUpRaw(raw: string): string {
    return tidyUpAnnotation(raw, this.transcrService.guidelines);
  }

  private onTextMouseOver = (event) => {
    const jqueryObj = jQuery(event.target);

    if (!(jqueryObj.attr('data-samples') === null || jqueryObj.attr('data-samples') === undefined)) {
      this.onSegmentBoundaryMouseOver(jqueryObj, event);
    } else if (!(jqueryObj.attr('data-errorcode') === null || jqueryObj.attr('data-errorcode') === undefined)) {
      this.onValidationErrorMouseOver(jqueryObj, event);
    }
  }

  private onSegmentBoundaryMouseOver(jqueryObj: any, event: any) {
    const segPopover = jQuery('.seg-popover');
    const width = segPopover.width();
    const height = segPopover.height();
    const editorPos = jQuery('.note-toolbar').offset();
    const segSamples = jqueryObj.attr('data-samples');

    if (!(segSamples === null || segSamples === undefined) && Functions.isNumber(segSamples)) {
      const samples = Number(segSamples);
      const time = new SampleUnit(samples, this.audioManager.sampleRate);

      segPopover.css({
        'margin-left': (event.target.offsetLeft - (width / 2)) + 'px',
        'margin-top': (jqueryObj.offset().top - editorPos.top - height - 10) + 'px',
        'z-index': 30,
        position: 'absolute',
        'background-color': 'white',
        display: 'inherit'
      });

      jqueryObj.css({
        cursor: 'pointer'
      });
      const timespan = new TimespanPipe();
      const text = timespan.transform(time.unix, {
        showHour: true,
        showMilliSeconds: true,
        maxDuration: this.audiochunk.time.duration.unix
      });
      segPopover.text(text);
    }
  }

  private onValidationErrorMouseOver(jQueryObj: any, event: any) {
    if (isUnset(jQueryObj.attr('data-errorcode'))) {
      jQueryObj = jQueryObj.parent();
    }

    const errorCode = jQueryObj.attr('data-errorcode');

    if (!(errorCode === null || errorCode === undefined)) {
      const errorDetails = this.transcrService.getErrorDetails(errorCode);

      if (!(errorDetails === null || errorDetails === undefined)) {
        // set values
        this.validationPopover.show();
        this.cd.markForCheck();
        this.cd.detectChanges();
        this.validationPopover.description = errorDetails.description;
        this.validationPopover.title = errorDetails.title;
        this.cd.markForCheck();
        this.cd.detectChanges();

        const cardHeader = jQuery('.note-toolbar.card-header');
        const editorPos = cardHeader.offset();

        let marginLeft = event.target.offsetLeft;
        const height = this.validationPopover.height;

        if (
          this.validationPopover.width + marginLeft > cardHeader.width()
          && marginLeft - this.validationPopover.width > 0
        ) {
          marginLeft -= this.validationPopover.width;

          if (jQueryObj.width() > 10) {
            marginLeft += 10;
          }
        }

        this.changeValidationPopoverLocation(marginLeft, (jQueryObj.offset().top - editorPos.top - height));
      }
    } else {
      console.error(`errorcode is null!`);
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
    if (playPosition.samples === 0) {
      playPosition = this.audioManager.createSampleUnit(1);
    }
    const segIndex = this.transcrService.currentlevel.segments.getSegmentBySamplePosition(playPosition);

    if (segIndex > -1 && segIndex !== this.lastHighlightedSegment) {
      this.saveSelection();
      const segment = this.transcrService.currentlevel.segments.get(segIndex);

      this.removeHighlight();

      let dom = jQuery('.note-editable.card-block p');
      if (dom.length === 0) {
        dom = jQuery('.note-editable.card-block');
      }

      let currentSegIndex = 0;
      let puffer = document.createElement('span');
      jQuery(puffer).addClass('highlighted');

      for (let i = 0; i < dom.contents().length; i++) {
        const domElements = dom.contents();
        const elem = domElements[i];

        if (!isUnset(elem)) {
          const tagName = jQuery(elem).prop('tagName');
          const addElemToPuffer = () => {
            if (currentSegIndex === segIndex && !isUnset(elem)) {
              jQuery(elem).remove();
              i--;
              puffer.appendChild(elem);
            }
          };

          if (!isUnset(tagName)) {
            if (tagName.toLowerCase() === 'img') {
              if (!isUnset(jQuery(elem).attr('data-samples'))) {
                const segSamples = Number(jQuery(elem).attr('data-samples'));
                const foundSegment = segment.time.samples;

                if (segSamples === foundSegment) {
                  if (puffer.childNodes.length > 0) {
                    jQuery(elem).before(puffer);
                  }
                  this.restoreSelection();
                  this.initPopover();
                  this.lastHighlightedSegment = currentSegIndex;
                  puffer = document.createElement('span');
                  break;
                } else {
                  puffer = document.createElement('span');
                  jQuery(puffer).addClass('highlighted');
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
      }

      if (puffer.childNodes.length > 0) {
        // puffer not added, last segment
        dom.append(puffer);
        this.lastHighlightedSegment = currentSegIndex;
        this.restoreSelection();
        this.initPopover();
      }
    }
  }

  private removeHighlight() {
    jQuery('.highlighted').each((index, item) => {
      if (!isUnset(jQuery(item).parent())) {
        jQuery(item).contents().each((j, node) => {
          jQuery(node).remove();
          jQuery(item).before(node);
        });
        jQuery(item).remove();
      } else {
        console.error(`item parent is null!`);
      }
    });
  }

  private onValidationErrorMouseLeave() {
    this.validationPopover.hide();
  }
}

// WrappedRange class for summernote
// https://summernote.org/deep-dive/#wrappedrange-object
abstract class WrappedRange {
  public readonly sc: Node;
  public readonly so: number;
  public readonly ec: Node;
  public readonly eo: number;

  constructor() {
  }

  // select update visible range
  abstract select();

  /**
   * insert node at current cursor
   */
  abstract insertNode(node: Node): Node;

  abstract collapse(isCollapseToStart?: boolean): WrappedRange;

  // splitText on range
  abstract splitText(): WrappedRange;

  // delete contents on range
  abstract deleteContents(): WrappedRange;

  // returns whether range was collapsed or not
  abstract isCollapsed(): boolean;

  /**
   * wrap inline nodes which children of body with paragraph
   */
  abstract wrapBodyInlineWithPara(): WrappedRange;

  // insert html at current cursor
  abstract pasteHTML(markup);

  /**
   * returns text in range
   */
  abstract toString(): string;

  /**
   * returns range for word before cursor
   *
   */
  abstract getWordRange(findAfter?: boolean): WrappedRange;

  /**
   * returns range for words before cursor that match with a Regex
   *
   * example:
   *  range: 'hi @Peter Pan'
   *  regex: '/@[a-z ]+/i'
   *  return range: '@Peter Pan'
   */
  abstract getWordsMatchRange(regex);

  /**
   * returns a list of DOMRect objects representing the area of the screen occupied by the range.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects
   *
   */
  abstract getClientRects();
}
