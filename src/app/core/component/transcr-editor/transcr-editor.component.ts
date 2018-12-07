import {ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {TranscrEditorConfig} from './config';
import {TranslateService} from '@ngx-translate/core';

import {BrowserInfo, KeyMapping, SubscriptionManager} from '../../shared';
import {TranscriptionService} from '../../shared/service';
import {Segments} from '../../obj/Annotation/Segments';
import {AudioChunk, AudioTime} from '../../../media-components/obj/media/audio';
import {isNumeric} from 'rxjs/util/isNumeric';
import {TimespanPipe} from '../../../media-components/pipe';
import {AudioManager} from '../../../media-components/obj/media/audio/AudioManager';
import {Functions} from '../../shared/Functions';

declare let lang: any;
declare let document: any;

@Component({
  selector: 'app-transcr-editor',
  templateUrl: './transcr-editor.component.html',
  styleUrls: ['./transcr-editor.component.css'],
  providers: [TranscrEditorConfig]
})
export class TranscrEditorComponent implements OnInit, OnDestroy, OnChanges {
  get textSelection(): { start: number; end: number } {
    return this._textSelection;
  }

  public get summernote() {
    return this.textfield.summernote;
  }

  public get caretpos(): number {
    if (!this.focused) {
      return -1;
    }
    return jQuery('.note-editable:eq(0)').caret('pos');
  }

  get audiomanager(): AudioManager {
    return this.audiochunk.audiomanager;
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

  get Settings(): any {
    return this._settings;
  }

  set Settings(value: any) {
    this._settings = value;
  }

  get html(): string {
    return (this.textfield) ? this.textfield.summernote('code') : '';
  }

  get rawText(): string {
    const result = this.tidyUpRaw(this._rawText);
    return result;
  }

  set rawText(value: string) {
    jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
    this._rawText = this.tidyUpRaw(value);
    this.init = 0;
    const html = this.rawToHTML(this._rawText);
    this.textfield.summernote('code', html);
    // this.validate();
    this.initPopover();
  }

  constructor(private cd: ChangeDetectorRef,
              private langService: TranslateService,
              private transcrService: TranscriptionService) {

    this._settings = new TranscrEditorConfig().Settings;
    this.subscrmanager = new SubscriptionManager();
  }

  @Output('loaded') loaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('onkeyup') onkeyup: EventEmitter<any> = new EventEmitter<any>();
  @Output('marker_insert') marker_insert: EventEmitter<string> = new EventEmitter<string>();
  @Output('marker_click') marker_click: EventEmitter<string> = new EventEmitter<string>();
  @Output('typing') typing: EventEmitter<string> = new EventEmitter<string>();
  @Output('boundaryclicked') boundaryclicked: EventEmitter<number> = new EventEmitter<number>();
  @Output('boundaryinserted') boundaryinserted: EventEmitter<number> = new EventEmitter<number>();
  @Output('selectionchanged') selectionchanged: EventEmitter<number> = new EventEmitter<number>();

  @Input() visible = true;
  @Input() markers: any = true;
  @Input() easymode = true;
  @Input() height = 0;
  @Input() playposition: AudioTime;
  @Input() audiochunk: AudioChunk;

  public textfield: any = null;
  public focused = false;

  public popovers = {
    segmentBoundary: null,
    validationError: null
  };

  private _settings: TranscrEditorConfig;
  private subscrmanager: SubscriptionManager;
  private init = 0;
  private summernote_ui: any = null;
  private _is_typing = false;
  private lastkeypress = 0;

  private _textSelection = {
    start: 0,
    end: 0
  };

  private _rawText = '';

  /**
   * converts the editor's html text to raw text
   * @returns {string}
   */
  getRawText = () => {
    let html = this.textfield.summernote('code');

    html = html.replace(/<((p)|(\s?\/p))>/g, '');
    html = html.replace(/&nbsp;/g, ' ');

    html = this.transcrService.replaceSingleTags(html);

    html = `<p>${html}</p>`;
    const dom = jQuery(html);
    let charCounter = 0;

    const replace_func = (i, elem) => {
      if (jQuery(elem).contents() !== null && jQuery(elem).contents().length > 0) {
        jQuery.each(jQuery(elem).contents(), replace_func);
      } else {
        const tagName = jQuery(elem).prop('tagName');

        let attr = jQuery(elem).attr('data-marker-code');
        if (elem.type === 'select-one') {
          const value = jQuery(elem).attr('data-value');
          attr += '=' + value;
        }
        if (attr) {
          const marker_code = Functions.unEscapeHtml(attr);

          for (let j = 0; j < this.markers.length; j++) {
            const marker = this.markers[j];
            if (marker_code === marker.code) {
              jQuery(elem).replaceWith(Functions.escapeHtml(marker_code));
              charCounter += marker_code.length;
              break;
            }
          }
        } else if (elem.nodeType === 3) {
          // is textNode
          const text = jQuery(elem).text();
          jQuery(elem).text(text);
          charCounter += text.length;
        } else if (tagName.toLowerCase() === 'img') {
          if (!(jQuery(elem).attr('data-samples') === null || jQuery(elem).attr('data-samples') === undefined)) {
            // TODO check if this is working
            const textnode = document.createTextNode(`{${jQuery(elem).attr('data-samples')}}`);
            jQuery(elem).before(textnode);
            jQuery(elem).remove();
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
          this._textSelection.start = charCounter;
          console.log(`save start to ${charCounter}!`);
        } else if (tagName.toLowerCase() === 'sel-end') {
          // save start selection
          this._textSelection.end = charCounter;
          console.log(`save end to ${charCounter}!`);
        }
      }
    };

    jQuery.each(dom.contents(), replace_func);

    const rawText = dom.text().replace(/[\s ]+/g, ' ');

    return rawText;
  }
  /**
   * initializes the editor and the containing summernote editor
   */
  public initialize = () => {
    this.summernote_ui = jQuery.summernote.ui;
    const Navigation = this.initNavigation();

    if (this.Settings.special_markers.boundary) {
      const customArray = this.createCustomButtonsArray();
      Navigation.buttons['boundary'] = customArray[0];
      Navigation.buttons['fontSizeUp'] = customArray[1];
      Navigation.buttons['fontSizeDown'] = customArray[2];
      Navigation.str_array.push('boundary');
      Navigation.str_array.push('fontSizeDown');
      Navigation.str_array.push('fontSizeUp');
    }

    /*

     modules: {
     'editor': Editor,
     'clipboard': Clipboard,
     'dropzone': Dropzone,
     'codeview': Codeview,
     'statusbar': Statusbar,
     'fullscreen': Fullscreen,
     'handle': Handle,
     // FIXME: HintPopover must be front of autolink
     //  - Script error about range when Enter key is pressed on hint popover
     'hintPopover': HintPopover,
     'autoLink': AutoLink,
     'autoSync': AutoSync,
     'placeholder': Placeholder,
     'buttons': Buttons,
     'toolbar': Toolbar,
     'linkDialog': LinkDialog,
     'linkPopover': LinkPopover,
     'imageDialog': ImageDialog,
     'imagePopover': ImagePopover,
     'videoDialog': VideoDialog,
     'helpDialog': HelpDialog,
     'airPopover': AirPopover
     },

     */
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
        ['default', Navigation.str_array]
      ],
      shortcuts: false,
      buttons: Navigation.buttons,
      callbacks: {
        onKeydown: this.onKeyDownSummernote,
        onKeyup: this.onKeyUpSummernote,
        onPaste: (e) => {
          e.preventDefault();
          const bufferText = ((e.originalEvent || e).clipboardData || (<any>window).clipboardData).getData('Text');
          let html = bufferText.replace(/(<p>)|(<\/p>)/g, '')
            .replace(new RegExp('\\\[\\\|', 'g'), '{').replace(new RegExp('\\\|\\\]', 'g'), '}');
          html = Functions.unEscapeHtml(html);
          html = '<span>' + this.rawToHTML(html) + '</span>';
          html = html.replace(/(<p>)|(<\/p>)|(<br\/?>)/g, '');
          const html_obj = jQuery(html);
          if (!(this.rawText === null || this.rawText === undefined) && this._rawText !== '') {
            this.textfield.summernote('editor.insertNode', html_obj[0]);
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
            this.textfield.summernote('restoreRange');
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
        'position': 'absolute',
        'margin-top': '0px',
        'z-index': '200',
        'display': 'none'
      });

    this.popovers.validationError.insertBefore('.note-editing-area');

    jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
    this.loaded.emit(true);
  }
  /**
   * inserts a marker to the editors html
   * @param marker_code
   * @param icon_url
   */
  insertMarker = (marker_code, icon_url) => {
    if ((icon_url === null || icon_url === undefined) || icon_url === '') {
      // text only
      this.textfield.summernote('editor.insertText', marker_code + ' ');
    } else {
      marker_code = marker_code.replace(/(<)|(>)/g, (g0, g1, g2) => {
        if (g2 === undefined && g1 !== undefined) {
          return '&lt;';
        } else {
          return '&gt;';
        }
      });

      const element = document.createElement('img');
      element.setAttribute('src', icon_url);
      element.setAttribute('class', 'btn-icon-text');
      element.setAttribute('style', 'height:16px');
      element.setAttribute('data-marker-code', marker_code);
      element.setAttribute('alt', marker_code);

      this.textfield.summernote('editor.insertNode', element);
    }
    this.updateTextField();
    console.log(`validate after inserting marker!`);
  }
  /**
   * called when key pressed in editor
   * @param $event
   */
  onKeyDownSummernote = ($event) => {
    const comboKey = KeyMapping.getShortcutCombination($event);
    const platform = BrowserInfo.platform;

    if (comboKey !== '') {
      if (this.isDisabledKey(comboKey)) {
        $event.preventDefault();
      } else {
        if (comboKey === 'ALT + S' && this.Settings.special_markers.boundary) {
          // add boundary
          this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
          this.boundaryinserted.emit(this.audiochunk.playposition.samples);
          $event.preventDefault();
        } else {
          for (let i = 0; i < this.markers.length; i++) {
            const marker: any = this.markers[i];
            if (marker.shortcut[platform] === comboKey) {
              $event.preventDefault();
              this.insertMarker(marker.code, marker.icon_url);
              this.marker_insert.emit(marker.name);
              return;
            }
          }
        }
      }
    }
  }
  /**
   * called after key up in editor
   * @param $event
   */
  onKeyUpSummernote = ($event) => {
    // update rawText
    this.updateTextField();
    this.onkeyup.emit($event);

    setTimeout(() => {
      if (Date.now() - this.lastkeypress >= 700 && this.lastkeypress > -1) {
        if (this._is_typing && this.focused) {
          this.typing.emit('stopped');
        }
        this._is_typing = false;
      }
    }, 700);

    if (!this._is_typing && this.focused) {
      this.typing.emit('started');
    }
    this._is_typing = true;
    this.lastkeypress = Date.now();


    setTimeout(() => {
      if (Date.now() - this.lastkeypress >= 1000 && this.lastkeypress > -1) {
        // this.validate();
        this.initPopover();
        this.lastkeypress = -1;
      }
    }, 1000);

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
        this.textfield.summernote('focus');
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
    this.initialize();
  }

  ngOnChanges(obj) {
    let renew = false;
    if (!(obj.markers === null || obj.markers === undefined) && obj.markers.previousValue !== obj.markers.newValue) {
      renew = true;
    }
    if (!(obj.easymode === null || obj.easymode === undefined) && obj.easymode.previousValue !== obj.easymode.newValue) {
      renew = true;
    }

    if (renew) {
      this.textfield.summernote('destroy');
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
      buttons: {},
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
   * @param marker
   * @returns {any}
   */
  createButton(marker): any {
    return () => {
      const platform = BrowserInfo.platform;
      let icon = '';
      if ((marker.icon_url === null || marker.icon_url === undefined) || marker.icon_url === '') {
        // text only
        icon = marker.button_text;

        if (!this.easymode) {
          icon = marker.button_text + '<span class=\'btn-shortcut\'>  ' +
            '[' + marker.shortcut[platform] + ']</span>';
          if (this.Settings.responsive) {
            icon = marker.button_text + '<span class=\'btn-shortcut d-none d-lg-inline\'>  ' +
              '[' + marker.shortcut[platform] + ']</span>';
          }
        } else {
          icon = marker.button_text;
        }
      } else {
        if (!this.easymode) {
          icon = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
            '<span class=\'btn-description\'>' + marker.button_text + '</span><span class=\'btn-shortcut\'> ' +
            '[' + marker.shortcut[platform] + ']</span>';
          if (this.Settings.responsive) {
            icon = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
              '<span class=\'btn-description d-none d-lg-inline\'>' + marker.button_text +
              '</span><span class=\'btn-shortcut d-none d-lg-inline\'> [' + marker.shortcut[platform] + ']</span>';
          }
        } else {
          icon = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon\' style=\'height:16px;\'/>';
        }
      }
      // create button
      const btn_js = {
        contents: icon,
        tooltip: marker.description,
        container: false,
        click: () => {
          // invoke insertText method with 'hello' on editor module.
          this.insertMarker(marker.code, marker.icon_url);
          // this.validate();
          this.marker_click.emit(marker.name);
          this.initPopover();
        }
      };
      const button = jQuery.summernote.ui.button(btn_js);

      return button.render();   // return button as jquery object
    };
  }

  initPopover() {
    this.popovers.validationError.css('display', 'none');
    this.popovers.segmentBoundary.css('display', 'none');
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
            this.boundaryclicked.emit(Number(samples));
          }
        })
        .on('mouseover', (event) => {
          this.onSegmentBoundaryMouseOver(jQuery(event.target), event);
        })
        .on('mouseleave', () => {
          jQuery('.seg-popover').css({
            'display': 'none'
          });
        });
    }, 200);


    // set popover for errors
    jQuery('.val-error')
      .off('mouseover')
      .off('mouseleave');

    setTimeout(() => {
      jQuery('.val-error')
        .on('mouseover', (event) => {
          this.onValidationErrorMouseOver(jQuery(event.target), event);
        })
        .on('mouseleave', (event) => {
          this.onValidationErrorMouseLeave(jQuery(event.target), event);
        });
    }, 200);
  }

  createCustomButtonsArray(): any[] {
    const result: any[] = [];

    // create boundary button
    const boundary_btn = () => {
      const boundary_label = this.langService.instant('special_markers.boundary.insert', {type: ''});
      const boundary_descr = this.langService.instant('special_markers.boundary.description', {type: ''});
      let icon = '';
      if (!this.easymode) {
        icon = '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
          '<span class=\'btn-description\'>' + boundary_label + '</span><span class=\'btn-shortcut\'> ' +
          '[ALT + S]</span>';
        if (this.Settings.responsive) {
          icon = '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
            '<span class=\'btn-description d-none d-md-inline\'>' + boundary_label + '</span>' +
            '<span class=\'btn-shortcut d-none d-lg-inline\'> ' +
            '[ALT + S]</span>';
        }
      } else {
        icon = '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon\' style=\'height:16px;\'/>';
      }
      // create button
      const btn_js = {
        contents: icon,
        tooltip: boundary_descr,
        container: false,
        click: () => {
          this.marker_click.emit('boundary');
          this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
        }
      };
      const button = jQuery.summernote.ui.button(btn_js);

      return button.render();   // return button as jquery object
    };

    result.push(boundary_btn);

    // create boundary button
    const fontSizeUp = () => {
      const icon = '<img src=\'assets/img/components/transcr-editor/increaseFont.png\' class=\'btn-icon\' style=\'height:20px;\'/>';
      // create button
      const btn_js = {
        contents: icon,
        tooltip: 'increase font size',
        container: false,
        click: () => {
          jQuery('.transcr-editor .note-editable.card-block').css('font-size', (++this.transcrService.defaultFontSize) + 'px');
        }
      };
      const button = jQuery.summernote.ui.button(btn_js);

      return button.render();   // return button as jquery object
    };

    result.push(fontSizeUp);

    // create boundary button
    const fontSizeDown = () => {
      const icon = '<img src=\'assets/img/components/transcr-editor/decreaseFont.png\' class=\'btn-icon\' style=\'height:20px;\'/>';
      // create button
      const btn_js = {
        contents: icon,
        tooltip: 'decrease font size',
        container: false,
        click: () => {
          jQuery('.transcr-editor .note-editable.card-block').css('font-size', (--this.transcrService.defaultFontSize) + 'px');
        }
      };
      const button = jQuery.summernote.ui.button(btn_js);

      return button.render();   // return button as jquery object
    };

    result.push(fontSizeDown);

    return result;
  }

  insertBoundary(img_url: string) {
    const element = document.createElement('img');
    element.setAttribute('src', img_url);
    element.setAttribute('class', 'btn-icon-text boundary');
    element.setAttribute('style', 'height:16px');
    element.setAttribute('data-samples', this.audiochunk.playposition.samples.toString());
    element.setAttribute('alt', '[|' + this.audiochunk.playposition.samples.toString() + '|]');

    this.textfield.summernote('editor.insertText', ' ');
    this.textfield.summernote('editor.insertNode', element);
    this.textfield.summernote('editor.insertText', ' ');

    // set popover
    setTimeout(() => {
      jQuery(element).on('click', (event) => {
        const jqueryobj = jQuery(event.target);
        const samples = jqueryobj.attr('data-samples');

        if (isNumeric(samples)) {
          this.boundaryclicked.emit(Number(samples));
        }
      })
        .on('mouseover', (event) => {
          this.onTextMouseOver(event);
        })
        .on('mouseleave', () => {
          jQuery('.seg-popover').css({
            'display': 'none'
          });
        });
    }, 200);

    this.updateTextField();
  }

  saveSelection() {
    let sel, range, node;

    jQuery('sel-start').remove();
    jQuery('sel-end').remove();

    if (window.getSelection) {
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = window.getSelection().getRangeAt(0);
        const range2 = range.cloneRange();

        // Range.createContextualFragment() would be useful here but is
        // non-standard and not supported in all browsers (IE9, for one)
        const el = document.createElement('sel-end');
        let frag = document.createDocumentFragment(), node, lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.collapse(false);
        range.insertNode(el);

        range2.collapse(true);
        const el2 = document.createElement('sel-start');
        range2.insertNode(el2);
      }
    } else if (document.hasOwnProperty('selection') && document.selection.hasOwnProperty('createRange')) {
      alert('?');
      /*
      range = document.selection.createRange();
      expandedSelRange = range.duplicate();
      range.collapse(false);
      range.pasteHTML(html);
      expandedSelRange.setEndPoint('EndToEnd', range);
      expandedSelRange.select();
      */
    }
  }

  restoreSelection() {
    const elem = document.getElementsByClassName('note-editable')[0];

    if (!(elem === null || elem === undefined) && elem.getElementsByTagName('sel-start')[0] !== undefined) {
      const el = elem;
      const range = document.createRange();
      const sel = window.getSelection();
      const selStart = elem.getElementsByTagName('sel-start')[0].previousSibling;
      const selEnd = elem.getElementsByTagName('sel-end')[0].nextSibling;

      const endOffset = 0;

      const childLength = el.childNodes.length;

      if (selStart !== null) {
        // set start position
        let lastNodeChildren = selStart.childNodes.length;
        if (selStart.nodeName === '#text') {
          lastNodeChildren = selStart.textContent.length;
        }
        range.setStart(selStart, lastNodeChildren);

        if (selEnd !== null) {
          range.setEnd(selEnd, endOffset);
          range.collapse(false);
        }

        sel.removeAllRanges();
        sel.addRange(range);
        // TODO change to specific textfield!
        jQuery('sel-start').remove();
        jQuery('sel-end').remove();
      } else {
        console.error('cursor is null!');
      }
    } else {
      console.error('elem is null');
    }
  }

  /**
   * updates the raw text of the editor
   */
  updateTextField() {
    this._rawText = this.getRawText();
    jQuery('.transcr-editor .note-editable.card-block').css('font-size', this.transcrService.defaultFontSize + 'px');
  }

  /**
   * adds the comboKey to the list of disabled Keys
   * @param comboKey
   * @returns {boolean}
   */
  public addDisableKey(comboKey: string): boolean {
    for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
      if (this.Settings.disabled_keys[i] === comboKey) {
        return false;
      }
    }
    this.Settings.disabled_keys.push(comboKey);
    return true;
  }

  /**
   * removes the combokey of list of disabled keys
   * @param comboKey
   * @returns {boolean}
   */
  public removeDisableKey(comboKey: string): boolean {
    let j = -1;
    for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
      if (this.Settings.disabled_keys[i] === comboKey) {
        j = i;
        return true;
      }
    }
    this.Settings.disabled_keys.splice(j, 1);

    return (j > -1);
  }

  public convertEntitiesToString(str: string) {
    return jQuery('<textarea />').html(str).text();
  }

  public saveRange() {
    this.textfield.summernote('saveRange');
  }

  public restoreRange() {
    this.textfield.summernote('restoreRange');
  }

  public getSegmentByCaretPos(caretpos: number): number {
    let rawtext = this.getRawText();

    const regex2 = /{([0-9]+)}/g;

    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i];

      const replace_func = (x, g1, g2, g3) => {
        const s1 = (g1) ? g1 : '';
        const s3 = (g3) ? g3 : '';
        return s1 + 'X' + s3;
      };

      const regex = new RegExp('(\\s)*(' + Functions.escapeRegex(marker.code) + ')(\\s)*', 'g');

      rawtext = rawtext.replace(regex, replace_func);
    }

    const seg_texts = rawtext.split(regex2).filter((a) => {
      if (!isNumeric(a)) {
        return a;
      }
    });

    let start = 0;

    if (seg_texts.length > 1) {
      if (caretpos === 0) {
        return 0;
      } else if (caretpos >= rawtext.replace(/\s?{([0-9]+)}\s?/g, ' ').length) {
        return seg_texts.length - 1;
      }

      for (let i = 0; i < seg_texts.length; i++) {
        const text = seg_texts[i];
        if (start >= caretpos) {
          return Math.max(0, i - 1);
        }
        start += text.length - 1;
      }

      if (start >= caretpos) {
        return seg_texts.length - 1;
      }

    }

    return -1;
  }

  /**
   * destroys the summernote editor
   */
  private destroy() {
    this.textfield.summernote('destroy');
    // delete tooltip overlays
    jQuery('.tooltip').remove();
    this.subscrmanager.destroy();
  }

  private validate() {
    this.saveSelection();

    this._rawText = this.getRawText();

    // insert selection placeholders
    let code = Functions.insertString(this._rawText, this._textSelection.start, '[[[sel-start]]][[[/sel-start]]]');
    code = Functions.insertString(code, this._textSelection.end + '[[[sel-start]]][[[/sel-start]]]'.length, '[[[sel-end]]][[[/sel-end]]]');

    code = this.transcrService.underlineTextRed(code, validateAnnotation(code, this.transcrService.guidelines));
    code = this.transcrService.rawToHTML(code);
    code = code.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
      if (g1 === '[[[') {
        return '<';
      }
      return '>';
    });

    let segmentCounter = 0;
    code = code.replace(/{([0-9]+)}/g, (g0, g1) => {
      return `<img src="assets/img/components/transcr-editor/boundary.png" class="btn-icon-text boundary" style="height: 16px; cursor: pointer;" data-samples="${g1}" alt="[|${++segmentCounter}|]" />`;
    });


    this.textfield.summernote('code', code);
    console.log(`END:`);
    console.log(code);
    this.restoreSelection();
  }


  private underlineTextRed(validation: any[]) {
    const result = this._rawText;

    const puffer = {};

    if (validation.length > 0) {
      for (let i = 0; i < validation.length; i++) {
        if (!puffer.hasOwnProperty('p' + validation[i].start)) {
          puffer['p' + validation[i].start] = '';
        }
        if (!puffer.hasOwnProperty('p' + (validation[i].start + validation[i].length))) {
          puffer['p' + (validation[i].start + validation[i].length)] = '';
        }

        puffer['p' + validation[i].start] += '<div class=\'error_underline\'>';
        puffer['p' + (validation[i].start + validation[i].length)] = '</div>' + puffer['p' + (validation[i].start + validation[i].length)];
      }
    }
    return result;
  }

  /**
   * checks if the combokey is part of the configs disabledkeys
   * @param comboKey
   * @returns {boolean}
   */
  private isDisabledKey(comboKey: string): boolean {
    for (let i = 0; i < this.Settings.disabled_keys.length; i++) {
      if (this.Settings.disabled_keys[i] === comboKey) {
        return true;
      }
    }
    return false;
  }

  /**
   * converts raw text of markers to html
   * @param rawtext
   * @returns {string}
   */
  private rawToHTML(rawtext: string): string {
    // TODO remove duplicate code here and in transcrService!
    let result: string = rawtext;

    if (rawtext !== '') {
      result = result.replace(/\r?\n/g, ' '); // .replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // replace markers with no wrap

      const markers = this.markers;
      // replace all tags that are not markers
      result = result.replace(new RegExp('(<\/?)?([^<>]+)(>)', 'g'), (g0, g1, g2, g3) => {
        for (let i = 0; i < markers.length; i++) {
          const marker = markers[i];

          if (`${g1}${g2}${g3}` === marker.code) {
            return `[[[${g2}]]]`;
          }
        }

        return `${g1}${g2}${g3}`;
      });

      // replace
      result = result.replace(/(<\/?)?([^<>]+)(>)/g, (g0, g1, g2, g3) => {
        // define allowed html tags here
        if (g2 !== 'img' && g2 !== 'span' && g2 !== 'div' && g2 !== 'i' && g2 !== 'b' && g2 !== 'u' && g2 !== 's') {
          return `&lt;${g2}&gt;`;
        }
        return `${g1}${g2}${g3}`;
      });

      result = result.replace(/(\[\[\[)|(]]])/g, (g0, g1, g2) => {
        if (g2 === undefined && g1 !== undefined) {
          return '<';
        } else {
          return '>';
        }
      });

      for (let i = 0; i < this.markers.length; i++) {
        const marker = this.markers[i];

        const regex = new RegExp('(\\s)*(' + Functions.escapeRegex(marker.code) + ')(\\s)*', 'g');
        const regex2 = /{([0-9]+)}/g;

        const replace_func = (x, g1, g2, g3) => {
          const s1 = (g1) ? g1 : '';
          const s3 = (g3) ? g3 : '';

          let img = '';
          if (!((marker.icon_url === null || marker.icon_url === undefined) || marker.icon_url === '')) {
            const marker_code = marker.code.replace(/</g, '&amp;lt;').replace(/>/g, '&amp;gt;');
            img = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon-text boundary\' style=\'height:16px;\' ' +
              'data-marker-code=\'' + marker_code + '\' alt=\'' + marker_code + '\'/>';
          } else {
            img = marker.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          }

          return s1 + img + s3;
        };


        const replace_func2 = (x, g1) => {
          return ' <img src=\'assets/img/components/transcr-editor/boundary.png\' ' +
            'class=\'btn-icon-text boundary\' style=\'height:16px;\' ' +
            'data-samples=\'' + g1 + '\' alt=\'\[|' + g1 + '|\]\' /> ';
        };

        result = result.replace(regex2, replace_func2);
        result = result.replace(regex, replace_func);
      }

      result = result.replace(/\s+$/g, '&nbsp;');
    }

    // wrap result with <p>. Missing this would cause the editor fail on marker insertion
    result = (result !== '') ? '<p>' + result + '</p>' : '<p><br/></p>';

    return result;
  }

  /**
   * tidy up the raw text, remove white spaces etc.
   * @param raw
   * @returns {string}
   */
  private tidyUpRaw(raw: string): string {
    return tidyUpAnnotation(raw, this.transcrService.guidelines);
  }

  private onTextMouseOver = (event) => {
    const jqueryObj = jQuery(event.target);

    console.log(`in text mouseover!`);
    if (!(jqueryObj.attr('data-samples') === null || jqueryObj.attr('data-samples') === undefined)) {
      console.log(`on text mouse over target`);
      this.onSegmentBoundaryMouseOver(jqueryObj, event);
    } else if (!(jqueryObj.attr('data-errorcode') === null || jqueryObj.attr('data-errorcode') === undefined)) {
      this.onValidationErrorMouseOver(jqueryObj, event);
    }
  }

  private onSegmentBoundaryMouseOver(jqueryObj: any, event: any) {
    const seg_popover = jQuery('.seg-popover');
    const width = seg_popover.width();
    const height = seg_popover.height();
    const editor_pos = jQuery('.note-toolbar').offset();
    const seg_samples = jqueryObj.attr('data-samples');

    if (!(seg_samples === null || seg_samples === undefined) && Functions.isNumber(seg_samples)) {
      const samples = Number(seg_samples);
      const time = new AudioTime(samples, this.audiomanager.ressource.info.samplerate);

      seg_popover.css({
        'margin-left': (event.target.offsetLeft - (width / 2)) + 'px',
        'margin-top': (jqueryObj.offset().top - editor_pos.top - height - 10) + 'px',
        'z-index': 30,
        'position': 'absolute',
        'background-color': 'white',
        'display': 'inherit'
      });

      jqueryObj.css({
        'cursor': 'pointer'
      });
      const timespan = new TimespanPipe();
      const text = timespan.transform(time.unix.toString());
      seg_popover.text(text);
    }
  }

  private onValidationErrorMouseOver(jQueryObj: any, event: any) {
    const errorCode = jQueryObj.attr('data-errorcode');

    if (!(errorCode === null || errorCode === undefined)) {
      const errorDetails = this.transcrService.getErrorDetails(errorCode);

      if (!(errorDetails === null || errorDetails === undefined)) {
        // set values
        this.popovers.validationError.css('display', 'inherit');
        this.popovers.validationError.find('.error-title').text(errorDetails.title);
        this.popovers.validationError.find('.card-body').text(errorDetails.description);

        const width = this.popovers.validationError.width();
        const height = this.popovers.validationError.height();
        const editor_pos = jQuery('.note-toolbar-wrapper').offset();

        let marginLeft = event.target.offsetLeft;
        if (event.target.offsetLeft + width > jQuery('.note-toolbar-wrapper').width()) {
          marginLeft = event.target.offsetLeft - width;
        }
        this.popovers.validationError.css(
          {
            'margin-left': marginLeft + 'px',
            'margin-top': (jQueryObj.offset().top - editor_pos.top - height) + 'px'
          }
        );
      }
    }
  }

  private onValidationErrorMouseLeave(jQueryObj: any, event: any) {
    this.popovers.validationError.css('display', 'none');
  }

  /*

   summernote options


   $.summernote = $.extend($.summernote, {
   version: '0.8.4',
   ui: ui,
   dom: dom,

   plugins: {},

   options: {
   modules: {
   'editor': Editor,
   'clipboard': Clipboard,
   'dropzone': Dropzone,
   'codeview': Codeview,
   'statusbar': Statusbar,
   'fullscreen': Fullscreen,
   'handle': Handle,
   // FIXME: HintPopover must be front of autolink
   //  - Script error about range when Enter key is pressed on hint popover
   'hintPopover': HintPopover,
   'autoLink': AutoLink,
   'autoSync': AutoSync,
   'placeholder': Placeholder,
   'buttons': Buttons,
   'toolbar': Toolbar,
   'linkDialog': LinkDialog,
   'linkPopover': LinkPopover,
   'imageDialog': ImageDialog,
   'imagePopover': ImagePopover,
   'videoDialog': VideoDialog,
   'helpDialog': HelpDialog,
   'airPopover': AirPopover
   },

   buttons: {},

   lang: 'en-US',

   // toolbar
   toolbar: [
   ['style', ['style']],
   ['font', ['bold', 'underline', 'clear']],
   ['fontname', ['fontname']],
   ['color', ['color']],
   ['para', ['ul', 'ol', 'paragraph']],
   ['table', ['table']],
   ['insert', ['link', 'picture', 'video']],
   ['view', ['fullscreen', 'codeview', 'help']]
   ],

   // popover
   popover: {
   image: [
   ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
   ['float', ['floatLeft', 'floatRight', 'floatNone']],
   ['remove', ['removeMedia']]
   ],
   link: [
   ['link', ['linkDialogShow', 'unlink']]
   ],
   air: [
   ['color', ['color']],
   ['font', ['bold', 'underline', 'clear']],
   ['para', ['ul', 'paragraph']],
   ['table', ['table']],
   ['insert', ['link', 'picture']]
   ]
   },

   // air mode: inline editor
   airMode: false,

   width: null,
   height: null,
   linkTargetBlank: true,

   focus: false,
   tabSize: 4,
   styleWithSpan: true,
   shortcuts: true,
   textareaAutoSync: true,
   direction: null,
   tooltip: 'auto',

   styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

   fontNames: [
   'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
   'Helvetica Neue', 'Helvetica', 'Impact', 'Lucida Grande',
   'Tahoma', 'Times New Roman', 'Verdana'
   ],

   fontSizes: ['8', '9', '10', '11', '12', '14', '18', '24', '36'],

   // pallete colors(n x n)
   colors: [
   ['#000000', '#424242', '#636363', '#9C9C94', '#CEC6CE', '#EFEFEF', '#F7F7F7', '#FFFFFF'],
   ['#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF'],
   ['#F7C6CE', '#FFE7CE', '#FFEFC6', '#D6EFD6', '#CEDEE7', '#CEE7F7', '#D6D6E7', '#E7D6DE'],
   ['#E79C9C', '#FFC69C', '#FFE79C', '#B5D6A5', '#A5C6CE', '#9CC6EF', '#B5A5D6', '#D6A5BD'],
   ['#E76363', '#F7AD6B', '#FFD663', '#94BD7B', '#73A5AD', '#6BADDE', '#8C7BC6', '#C67BA5'],
   ['#CE0000', '#E79439', '#EFC631', '#6BA54A', '#4A7B8C', '#3984C6', '#634AA5', '#A54A7B'],
   ['#9C0000', '#B56308', '#BD9400', '#397B21', '#104A5A', '#085294', '#311873', '#731842'],
   ['#630000', '#7B3900', '#846300', '#295218', '#083139', '#003163', '#21104A', '#4A1031']
   ],

   lineHeights: ['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '3.0'],

   tableClassName: 'table table-bordered',

   insertTableMaxSize: {
   col: 10,
   row: 10
   },

   dialogsInBody: false,
   dialogsFade: false,

   maximumImageFileSize: null,

   callbacks: {
   onInit: null,
   onFocus: null,
   onBlur: null,
   onEnter: null,
   onKeyup: null,
   onKeydown: null,
   onImageUpload: null,
   onImageUploadError: null
   },

   codemirror: {
   mode: 'text/html',
   htmlMode: true,
   lineNumbers: true
   },

   keyMap: {
   pc: {
   'ENTER': 'insertParagraph',
   'CTRL+Z': 'undo',
   'CTRL+Y': 'redo',
   'TAB': 'tab',
   'SHIFT+TAB': 'untab',
   'CTRL+B': 'bold',
   'CTRL+I': 'italic',
   'CTRL+U': 'underline',
   'CTRL+SHIFT+S': 'strikethrough',
   'CTRL+BACKSLASH': 'removeFormat',
   'CTRL+SHIFT+L': 'justifyLeft',
   'CTRL+SHIFT+E': 'justifyCenter',
   'CTRL+SHIFT+R': 'justifyRight',
   'CTRL+SHIFT+J': 'justifyFull',
   'CTRL+SHIFT+NUM7': 'insertUnorderedList',
   'CTRL+SHIFT+NUM8': 'insertOrderedList',
   'CTRL+LEFTBRACKET': 'outdent',
   'CTRL+RIGHTBRACKET': 'indent',
   'CTRL+NUM0': 'formatPara',
   'CTRL+NUM1': 'formatH1',
   'CTRL+NUM2': 'formatH2',
   'CTRL+NUM3': 'formatH3',
   'CTRL+NUM4': 'formatH4',
   'CTRL+NUM5': 'formatH5',
   'CTRL+NUM6': 'formatH6',
   'CTRL+ENTER': 'insertHorizontalRule',
   'CTRL+K': 'linkDialog.show'
   },

   mac: {
   'ENTER': 'insertParagraph',
   'CMD+Z': 'undo',
   'CMD+SHIFT+Z': 'redo',
   'TAB': 'tab',
   'SHIFT+TAB': 'untab',
   'CMD+B': 'bold',
   'CMD+I': 'italic',
   'CMD+U': 'underline',
   'CMD+SHIFT+S': 'strikethrough',
   'CMD+BACKSLASH': 'removeFormat',
   'CMD+SHIFT+L': 'justifyLeft',
   'CMD+SHIFT+E': 'justifyCenter',
   'CMD+SHIFT+R': 'justifyRight',
   'CMD+SHIFT+J': 'justifyFull',
   'CMD+SHIFT+NUM7': 'insertUnorderedList',
   'CMD+SHIFT+NUM8': 'insertOrderedList',
   'CMD+LEFTBRACKET': 'outdent',
   'CMD+RIGHTBRACKET': 'indent',
   'CMD+NUM0': 'formatPara',
   'CMD+NUM1': 'formatH1',
   'CMD+NUM2': 'formatH2',
   'CMD+NUM3': 'formatH3',
   'CMD+NUM4': 'formatH4',
   'CMD+NUM5': 'formatH5',
   'CMD+NUM6': 'formatH6',
   'CMD+ENTER': 'insertHorizontalRule',
   'CMD+K': 'linkDialog.show'
   }
   },
   icons: {
   'align': 'note-icon-align',
   'alignCenter': 'note-icon-align-center',
   'alignJustify': 'note-icon-align-justify',
   'alignLeft': 'note-icon-align-left',
   'alignRight': 'note-icon-align-right',
   'indent': 'note-icon-align-indent',
   'outdent': 'note-icon-align-outdent',
   'arrowsAlt': 'note-icon-arrows-alt',
   'bold': 'note-icon-bold',
   'caret': 'note-icon-caret',
   'circle': 'note-icon-circle',
   'close': 'note-icon-close',
   'code': 'note-icon-code',
   'eraser': 'note-icon-eraser',
   'font': 'note-icon-font',
   'frame': 'note-icon-frame',
   'italic': 'note-icon-italic',
   'link': 'note-icon-link',
   'unlink': 'note-icon-chain-broken',
   'magic': 'note-icon-magic',
   'menuCheck': 'note-icon-check',
   'minus': 'note-icon-minus',
   'orderedlist': 'note-icon-orderedlist',
   'pencil': 'note-icon-pencil',
   'picture': 'note-icon-picture',
   'question': 'note-icon-question',
   'redo': 'note-icon-redo',
   'square': 'note-icon-square',
   'strikethrough': 'note-icon-strikethrough',
   'subscript': 'note-icon-subscript',
   'superscript': 'note-icon-superscript',
   'table': 'note-icon-table',
   'textHeight': 'note-icon-text-height',
   'trash': 'note-icon-trash',
   'underline': 'note-icon-underline',
   'undo': 'note-icon-undo',
   'unorderedlist': 'note-icon-unorderedlist',
   'video': 'note-icon-video'
   }
   }
   });

   */
}
