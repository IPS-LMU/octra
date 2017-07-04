import {ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';
import {TranscrEditorConfig} from './config/te.config';
import {TranslateService} from '@ngx-translate/core';

import {BrowserInfo, Functions, KeyMapping, SubscriptionManager} from '../../shared';
import {TranscrEditorConfigValidator} from './validator/TranscrEditorConfigValidator';
import {SettingsService} from '../../shared/service/settings.service';
import {TranscriptionService} from '../../shared/service/transcription.service';
import {isNullOrUndefined} from 'util';
import {Segments} from '../../obj/Segments';
import {TimespanPipe} from '../../shared/pipe/timespan.pipe';
import {AudioTime} from '../../obj/AudioTime';
import {AudioService} from '../../shared/service/audio.service';
declare var window: any;

@Component({
  selector: 'app-transcr-editor',
  templateUrl: './transcr-editor.component.html',
  styleUrls: ['./transcr-editor.component.css'],
  providers: [TranscrEditorConfig]
})

export class TranscrEditorComponent implements OnInit, OnDestroy, OnChanges {
  get is_typing(): boolean {
    return this._is_typing;
  }

  @Output('loaded') loaded: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output('onkeyup') onkeyup: EventEmitter<any> = new EventEmitter<any>();
  @Output('marker_insert') marker_insert: EventEmitter<string> = new EventEmitter<string>();
  @Output('marker_click') marker_click: EventEmitter<string> = new EventEmitter<string>();
  @Output('typing') typing: EventEmitter<string> = new EventEmitter<string>();

  private _settings: TranscrEditorConfig;
  private subscrmanager: SubscriptionManager;
  private init = 0;
  public focused = false;

  public segpopover: any = null;

  @Input() visible = true;
  @Input() markers: any = true;
  @Input() easymode = true;
  @Input() height = 0;
  @Input() playposition: AudioTime;

  get rawText(): string {
    return this.tidyUpRaw(this._rawText);
  }

  set rawText(value: string) {
    this._rawText = this.tidyUpRaw(value);
    this.init = 0;
    const html = this.rawToHTML(this._rawText);
    this.textfield.summernote('code', html);

    this.initPopover();
  }

  set segments(segments: Segments) {
    let result = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments.get(i);
      result += seg.transcript;

      if (i < segments.length - 1) {
        result += `[|${i}]`;
      }
    }
    this.rawText = result;
  }

  get Settings(): any {
    return this._settings;
  }

  get html(): string {
    return (this.textfield) ? this.textfield.summernote('code') : '';
  }

  set Settings(value: any) {
    this._settings = value;
  }

  public textfield: any = null;
  private _rawText = '';
  private _html = '';
  private summernote_ui: any = null;
  private _is_typing = false;
  private lastkeypress = 0;

  constructor(private cd: ChangeDetectorRef,
              private settingsService: SettingsService,
              private langService: TranslateService,
              private transcrService: TranscriptionService,
              private audio: AudioService) {

    this._settings = new TranscrEditorConfig().Settings;
    this.subscrmanager = new SubscriptionManager();
    this.validateConfig();
  }

  ngOnInit() {
    this.Settings.height = this.height;
    this.initialize();
  }

  ngOnChanges(obj) {
    let renew = false;
    if (!isNullOrUndefined(obj.markers) && obj.markers.previousValue !== obj.markers.newValue) {
      renew = true;
    }
    if (!isNullOrUndefined(obj.easymode) && obj.easymode.previousValue !== obj.easymode.newValue) {
      renew = true;
    }

    if (renew) {
      this.textfield.summernote('destroy');
      this.initialize();
    }
  }

  /**
   * converts the editor's html text to raw text
   * @returns {string}
   */
  getRawText = () => {
    let result = '';
    let html = this.textfield.summernote('code');

    html = '<p>' + html + '</p>';
    const dom = jQuery(html);

    const replace_func = (i, elem) => {
      if (jQuery(elem).children() !== null && jQuery(elem).children().length > 0) {
        jQuery.each(jQuery(elem).children(), replace_func);
      } else {
        let attr = jQuery(elem).attr('data-marker-code');
        if (elem.type === 'select-one') {
          const value = jQuery(elem).attr('data-value');
          attr += '=' + value;
        }
        if (attr) {
          for (let j = 0; j < this.markers.length; j++) {
            const marker = this.markers[j];
            if (attr === marker.code) {

              jQuery(elem).replaceWith(Functions.escapeHtml(attr));
              break;
            }
          }
        } else if (jQuery(elem).attr('class') !== 'error_underline') {
          jQuery(elem).remove();
        }
      }
    };

    jQuery.each(dom.children(), replace_func);
    result = dom.text();

    return result;
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
   * destroys the summernote editor
   */
  private destroy() {
    this.textfield.summernote('destroy');
    // delete tooltip overlays
    jQuery('.tooltip').remove();
    this.subscrmanager.destroy();
  }

  /**
   * initializes the editor and the containing summernote editor
   */
  public initialize = () => {
    this.summernote_ui = jQuery.summernote.ui;
    const Navigation = this.initNavigation();
    Navigation.buttons['boundary'] = this.createCustomButtonsArray()[0];
    Navigation.str_array.push('boundary');

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
          // prevent copy paste

          const bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
          const html = this.rawToHTML(bufferText);
          const element = document.createElement('span');
          element.innerHTML = html;
          e.preventDefault();
          this.textfield.summernote('editor.insertNode', element);
          this.updateTextField();
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
        }
      }
    });

    this.textfield.summernote('removeModule', 'statusbar');
    this.textfield.summernote('removeModule', 'handle');
    this.textfield.summernote('removeModule', 'hintPopover');
    this.textfield.summernote('removeModule', 'imageDialog');
    this.textfield.summernote('removeModule', 'airPopover');

    // create seg popover

    this.segpopover = jQuery('<div></div>')
      .addClass('panel')
      .addClass('seg-popover')
      .html('00:00:000');

    this.segpopover.insertBefore('.note-editing-area');

    jQuery('.note-editable').on('click', (click) => {
      // const selection = jQuery('.note-editable').caret('pos');
      // alert(selection);
    });

    this.loaded.emit(true);
  }

  /**
   * initializes the navbar bar of the editor
   */
  initNavigation() {
    const result = {
      buttons: {},
      str_array: []
    };

    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i];
      result.buttons['' + i + ''] = this.createButton(marker);
      result.str_array.push('' + i + '');
    }

    return result;
  }

  /**
   * creates a marker button for the toolbar
   * @param marker
   * @returns {any}
   */
  createButton(marker): any {
    return (context) => {
      const platform = BrowserInfo.platform;
      let icon = '';
      if (!this.easymode) {
        icon = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
          '<span class=\'btn-description\'>' + marker.button_text + '</span><span class=\'btn-shortcut\'> ' +
          '[' + marker.shortcut[platform] + ']</span>';
        if (this.Settings.responsive) {
          icon = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
            '<span class=\'btn-description hidden-xs hidden-sm\'>' + marker.button_text +
            '</span><span class=\'btn-shortcut hidden-xs hidden-sm hidden-md\'> [' + marker.shortcut[platform] + ']</span>';
        }
      } else {
        icon = '<img src=\'' + marker.icon_url + '\' class=\'btn-icon\' style=\'height:16px;\'/>';
      }
      // create button
      const btn_js = {
        contents: icon,
        tooltip: marker.description,
        click: () => {
          // invoke insertText method with 'hello' on editor module.
          this.insertMarker(marker.code, marker.icon_url);
          this.marker_click.emit(marker.code);
          this.initPopover();
        }
      };
      const button = jQuery.summernote.ui.button(btn_js);

      return button.render();   // return button as jquery object
    }
  }

  initPopover() {
    // set popover
    jQuery('.btn-icon-text[data-samples]').off('click');
    setTimeout(() => {
      jQuery('.btn-icon-text[data-samples]').on('click', function (event) {
        const jqueryobj = jQuery(this);
        jqueryobj.css({
          'background-color': '#5add80'
        });
      })
        .on('mouseover', (event) => {
          const jqueryobj = jQuery(event.target);

          const width = jQuery('.seg-popover').width();
          const height = jQuery('.seg-popover').height();
          const editor_pos = jQuery('.note-toolbar.panel-heading').offset();
          const seg_samples = jqueryobj.attr('data-samples');

          if (!isNullOrUndefined(seg_samples) && Functions.isNumber(seg_samples)) {
            const samples = Number(seg_samples);
            const time = new AudioTime(samples, this.audio.samplerate);

            jQuery('.seg-popover').css({
              'margin-left': (event.target.offsetLeft - (width / 2)) + 'px',
              'margin-top': (jqueryobj.offset().top - editor_pos.top - height - 10) + 'px',
              'display': 'inherit'
            });
            const timespan = new TimespanPipe();
            const text = timespan.transform(time.unix.toString());
            jQuery('.seg-popover').text(text);
          }
        })
        .on('mouseleave', (event) => {
          jQuery('.seg-popover').css({
            'display': 'none'
          });
        });
    }, 200);
  }

  createCustomButtonsArray(): any[] {
    const result: any[] = [];

    // create boundary button
    const boundary_btn = (context) => {
      const platform = BrowserInfo.platform;
      let icon = '';
      if (!this.easymode) {
        icon = '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
          '<span class=\'btn-description\'>BOUNDARY DESCR</span><span class=\'btn-shortcut\'> ' +
          '[SHORTCUT]</span>';
        if (this.Settings.responsive) {
          icon = '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon\' style=\'height:16px;\'/> ' +
            '<span class=\'btn-description hidden-xs hidden-sm\'>BOUNDARY DESCR</span>' +
            '<span class=\'btn-shortcut hidden-xs hidden-sm hidden-md\'> ' +
            '[SHORTCUT]</span>';
        }
      } else {
        icon = '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon\' style=\'height:16px;\'/>';
      }
      // create button
      const btn_js = {
        contents: icon,
        tooltip: 'test',
        click: () => {
          this.marker_click.emit('boundary');
          this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
        }
      };
      const button = jQuery.summernote.ui.button(btn_js);

      return button.render();   // return button as jquery object
    };

    result.push(boundary_btn);

    return result;
  }

  test() {
    const ui = jQuery.summernote.ui;

    // create button
    const button = ui.button({
      contents: '<i class="fa fa-child"/> Hello',
      tooltip: 'hello'
    });

    return button.render();   // return button as jquery object
  }

  /**
   * inserts a marker to the editors html
   * @param marker_code
   * @param icon_url
   */
  insertMarker = function (marker_code, icon_url) {
    const element = document.createElement('img');
    element.setAttribute('src', icon_url);
    element.setAttribute('class', 'btn-icon-text');
    element.setAttribute('style', 'height:16px');
    element.setAttribute('data-marker-code', marker_code);
    element.setAttribute('alt', marker_code);

    this.textfield.summernote('editor.insertNode', element);
    this.updateTextField();
  };

  insertBoundary(img_url: string) {
    const element = document.createElement('img');
    element.setAttribute('src', img_url);
    element.setAttribute('class', 'btn-icon-text boundary');
    element.setAttribute('style', 'height:16px');
    element.setAttribute('data-samples', this.audio.playpostion.samples.toString());

    this.textfield.summernote('editor.insertNode', element);
    this.updateTextField();
    this.initPopover();
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
        if (comboKey === 'ALT + S') {
          // add boundary
          this.insertBoundary('assets/img/components/transcr-editor/boundary.png');
          $event.preventDefault();
        } else {
          for (let i = 0; i < this.markers.length; i++) {
            const marker: any = this.markers[i];
            if (marker.shortcut[platform] === comboKey) {
              $event.preventDefault();
              const test = this.textfield.summernote('createRange');
              this.insertMarker(marker.code, marker.icon_url);
              this.marker_insert.emit(marker.code);
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
      if (Date.now() - this.lastkeypress >= 700) {
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
  }

  /**
   * updates the raw text of the editor
   */
  updateTextField() {
    this._rawText = this.getRawText();
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

    return (j > -1) ? true : false;
  }

  /**
   * converts raw text of markers to html
   * @param rawtext
   * @returns {string}
   */
  private rawToHTML(rawtext: string): string {
    let result: string = rawtext;

    if (rawtext !== '') {
      // replace markers with no wrap
      for (let i = 0; i < this.markers.length; i++) {
        const marker = this.markers[i];

        const regex = new RegExp('(\\s)*(' + Functions.escapeRegex(marker.code) + ')(\\s)*', 'g');
        const regex2 = /\[\|([0-9]+)\]/g;

        const replace_func = (x, g1, g2, g3) => {
          const s1 = (g1) ? g1 : '';
          const s2 = (g2) ? g2 : '';
          const s3 = (g3) ? g3 : '';
          return s1 + '<img src=\'' + marker.icon_url + '\' class=\'btn-icon-text boundary\' style=\'height:16px;\' ' +
            'data-marker-code=\'' + marker.code + '\' alt=\'' + marker.code + '\'/>' + s3;
        };


        const replace_func2 = (x, g1) => {
          const s1 = (g1) ? g1 : '';

          const seg = this.transcrService.annotation.levels[0].segments.get(g1);
          return '<img src=\'assets/img/components/transcr-editor/boundary.png\' class=\'btn-icon-text boundary\' style=\'height:16px;\' ' +
            'data-samples=\'' + seg.time.samples + '\' />';
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
   * set focus to the very last position of the editors text
   */
  public focus = (later: boolean = false) => {
    const func = () => {
      try {
        if (this.rawText !== '' && this.html !== '<p><br/></p>') {
          Functions.placeAtEnd(jQuery('.note-editable.panel-body')[0]);
        }
        this.textfield.summernote('focus');
      } catch (exception) {
        // ignore errors
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

  /**
   * tidy up the raw text, remove white spaces etc.
   * @param raw
   * @returns {string}
   */
  private tidyUpRaw(raw: string): string {
    return tidyUpAnnotation(raw, this.transcrService.guidelines);
  }

  /**
   * replace markers of the input string with its html pojection
   * @param input
   * @param use_wrap
   * @returns {string}
   */
  private replaceMarkersWithHTML(input: string, use_wrap: boolean): string {
    let result = input;

    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i];
      result = result.replace(marker, '<img src=\'' + marker.icon_url + '\' class=\'btn-icon-text\' ' +
        'style=\'height:16px;\' data-marker-code=\'' + marker.code + '\' alt=\'' + marker.code + '\'/>');
    }
    return result;
  }

  private validateConfig() {
    const validator: TranscrEditorConfigValidator = new TranscrEditorConfigValidator();
    const validation = validator.validateObject(this._settings);
    if (!validation.success) {
      throw new Error(validation.error);
    }

  }

  private validate() {
    const val: any[] = this.transcrService.validate(this._rawText);
    let ok = this.underlineTextRed(val);
    ok = this.rawToHTML(ok);
    this.textfield.summernote('code', ok);
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
