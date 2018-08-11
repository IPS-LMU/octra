import {EventEmitter, Injectable} from '@angular/core';
import {Annotation, Level, OAnnotJSON, OAudiofile, OLabel, OLevel, OSegment, Segments} from '../../obj/Annotation';
import {AudioService} from './audio.service';
import {AppStorageService, OIDBLevel} from './appstorage.service';
import {Functions} from '../Functions';
import {UserInteractionsService} from './userInteractions.service';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {NavbarService} from '../../gui/navbar/navbar.service';
import {SubscriptionManager} from '../';
import {SettingsService} from './settings.service';
import {isNullOrUndefined} from 'util';
import {FeedBackForm} from '../../obj/FeedbackForm/FeedBackForm';
import {AnnotJSONConverter, Converter, IFile, TextConverter} from '../../obj/Converters';
import {AudioManager} from '../../../media-components/obj/media/audio';
import {OLog, OLogging} from '../../obj/Settings/logging';
import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class TranscriptionService {
  get audiomanager(): AudioManager {
    return this._audiomanager;
  }

  private subscrmanager: SubscriptionManager;
  public dataloaded = new EventEmitter<any>();
  public segmentrequested = new EventEmitter<number>();
  private _segments: Segments;
  private _last_sample: number;
  private _guidelines: any;
  private _audiofile: OAudiofile;
  private saving = false;
  public filename = '';
  private _feedback: FeedBackForm;
  private _break_marker: any = null;
  private state = 'ANNOTATED';
  private _selectedlevel = 0;
  private _statistic: any = {
    transcribed: 0,
    empty: 0,
    pause: 0
  };

  private _annotation: Annotation;

  private _audiomanager: AudioManager;

  public levelchanged: EventEmitter<Level> = new EventEmitter<Level>();

  get selectedlevel(): number {
    return this._selectedlevel;
  }

  set selectedlevel(value: number) {
    if (value > -1 && value < this.annotation.levels.length && this.annotation.levels[value].getTypeString() === 'SEGMENT') {
      this._selectedlevel = value;
    } else {
      this._selectedlevel = this.getSegmentFirstLevel();
    }

    this.levelchanged.emit(this._annotation.levels[this._selectedlevel]);
  }

  public getSegmentFirstLevel(): number {
    for (let i = 0; this.annotation.levels.length; i++) {
      if (this.annotation.levels[i].getTypeString() === 'SEGMENT') {
        return i;
      }
    }
    return -1;
  }

  get audiofile(): OAudiofile {
    return this._audiofile;
  }

  get annotation(): Annotation {
    return this._annotation;
  }

  set annotation(value: Annotation) {
    this._annotation = value;
  }

  get feedback(): FeedBackForm {
    return this._feedback;
  }

  set break_marker(value: any) {
    this._break_marker = value;
  }

  set guidelines(value: any) {
    this._guidelines = value;
  }

  get guidelines(): any {
    return this._guidelines;
  }

  get last_sample(): number {
    return this._last_sample;
  }

  set last_sample(value: number) {
    this._last_sample = value;
  }

  public get currentlevel(): Level {
    return this._annotation.levels[this._selectedlevel];
  }

  /*
   get segments(): Segments {

   return this._segments;
   }
   */

  public validate(text: string): any {
    return validateAnnotation(text, this._guidelines);
  }

  /*
   set segments(value: Segments) {
   this._segments = value;
   }
   */

  private get app_settings(): AppSettings {
    return this.settingsService.app_settings;
  }

  private get projectsettings(): ProjectSettings {
    return this.settingsService.projectsettings;
  }

  get break_marker(): any {
    return this._break_marker;
  }

  get statistic(): any {
    return this._statistic;
  }

  constructor(private audio: AudioService,
              private appStorage: AppStorageService,
              private uiService: UserInteractionsService,
              private navbarServ: NavbarService,
              private settingsService: SettingsService,
              private http: HttpClient) {
    this.subscrmanager = new SubscriptionManager();

    this.subscrmanager.add(this.navbarServ.onexportbuttonclick.subscribe((button) => {
      if (button.format === 'text') {
        // format to text file
        this.navbarServ.exportformats.text = this.getTranscriptString(new TextConverter());
      } else if (button.format === 'annotJSON') {
        // format to annotJSON file
        this.navbarServ.exportformats.annotJSON = this.getTranscriptString(new AnnotJSONConverter());
      }
    }));
  }

  /**
   * metod after audio was loaded
   */
  public load(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._audiomanager = this.audio.audiomanagers[0];

      this.filename = this._audiomanager.ressource.name;

      this._audiofile = new OAudiofile();
      this._audiofile.name = this._audiomanager.ressource.name + this._audiomanager.ressource.extension;
      this._audiofile.samplerate = this._audiomanager.ressource.info.samplerate;
      this._audiofile.duration = this._audiomanager.ressource.info.duration.samples;
      this._audiofile.size = this._audiomanager.ressource.size;

      this.last_sample = this._audiomanager.ressource.info.duration.samples;
      this.loadSegments(this._audiomanager.ressource.info.samplerate).then(
        () => {
          this.selectedlevel = 0;
          this.navbarServ.exportformats.filename = this.filename + this._audiomanager.ressource.extension;
          this.navbarServ.exportformats.bitrate = this._audiomanager.ressource.info.bitrate;
          this.navbarServ.exportformats.samplerate = this._audiomanager.ressource.info.samplerate;
          this.navbarServ.exportformats.filesize = Functions.getFileSize(this._audiomanager.ressource.size);
          this.navbarServ.exportformats.duration = this._audiomanager.ressource.info.duration.unix;

          resolve();
        }
      ).catch((err) => {
        reject(err);
      });
    });
  }

  public getTranscriptString(converter: Converter): string {
    let result: IFile;

    if (!isNullOrUndefined(this.annotation)) {
      result = converter.export(this.annotation.getObj(), this.audiofile, 0).file;

      return result.content;
    }

    return '';
  }

  public loadSegments(sample_rate: number): Promise<void> {
    return new Promise<void>(
      (resolve, reject) => {
        const process = () => {
          const annotates = this._audiomanager.ressource.name + this._audiomanager.ressource.extension;

          this._annotation = new Annotation(annotates, this._audiofile);

          if (!isNullOrUndefined(this.appStorage.annotation)) {
            for (let i = 0; i < this.appStorage.annotation.length; i++) {
              const level: Level = Level.fromObj(this.appStorage.annotation[i],
                this._audiomanager.ressource.info.samplerate, this._audiomanager.ressource.info.duration.samples);
              this._annotation.levels.push(level);
            }

            for (let i = 0; i < this.appStorage.annotation_links.length; i++) {
              this._annotation.links.push(this.appStorage.annotation_links[i].link);
            }


            this._feedback = FeedBackForm.fromAny(this.settingsService.projectsettings.feedback_form, this.appStorage.comment);
            this._feedback.importData(this.appStorage.feedback);

            if (isNullOrUndefined(this.appStorage.comment)) {
              this.appStorage.comment = '';
            } else {
              this._feedback.comment = this.appStorage.comment;
            }

            if (this.appStorage.logs === null) {
              this.appStorage.clearLoggingData();
              this.uiService.elements = [];
            } else {
              this.uiService.fromAnyArray(this.appStorage.logs);
            }

            this.navbarServ.dataloaded = true;
            this.dataloaded.emit();
          } else {
            reject(Error('annotation object in appStorage is null'));
          }
          resolve();
        };

        if (isNullOrUndefined(this.appStorage.annotation) || this.appStorage.annotation.length === 0) {
          const new_levels = [];
          const levels = this.createNewAnnotation().levels;
          for (let i = 0; i < levels.length; i++) {
            new_levels.push(new OIDBLevel(i + 1, levels[i], i));
          }

          this.appStorage.overwriteAnnotation(new_levels).then(() => {
            if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'url') {
              if (this.appStorage.usemode === 'url') {
                // load transcript from url

                // TODO continue implementing
                Functions.uniqueHTTPRequest(this.http, false, {
                  responseType: 'text'
                }, 'test.com', {});
              }

              if (!isNullOrUndefined(this.appStorage.servertranscipt)) {
                // import server transcript
                this.appStorage.annotation[this._selectedlevel].level.items = [];
                for (let i = 0; i < this.appStorage.servertranscipt.length; i++) {
                  const seg_t = this.appStorage.servertranscipt[i];

                  const oseg = new OSegment(i, seg_t.start, seg_t.length, [new OLabel('OCTRA_1', seg_t.text)]);
                  this.appStorage.annotation[this.selectedlevel].level.items.push(oseg);
                }
                // clear servertranscript
                this.appStorage.servertranscipt = null;

                this.appStorage.changeAnnotationLevel(this._selectedlevel,
                  this.appStorage.annotation[this._selectedlevel].level)
                  .catch(
                    (err) => {
                      console.error(err);
                    }
                  );
              }
            }

            process();
          }).catch((err) => {
            console.error(err);
          });
        } else {
          process();
        }
      }
    );
  }

  public exportDataToJSON(): any {
    let data: any = {};

    if (!isNullOrUndefined(this.annotation)) {
      const log_data: OLogging = this.extractUI(this.uiService.elements);

      data = {
        project: (isNullOrUndefined(this.appStorage.user.project)) ? 'NOT AVAILABLE' : this.appStorage.user.project,
        annotator: (isNullOrUndefined(this.appStorage.user.id)) ? 'NOT AVAILABLE' : this.appStorage.user.id,
        transcript: null,
        comment: this._feedback.comment,
        jobno: (isNullOrUndefined(this.appStorage.user.jobno)) ? 'NOT AVAILABLE' : this.appStorage.user.jobno,
        quality: this._feedback.exportData(),
        id: this.appStorage.data_id,
        log: log_data.getObj()
      };

      const transcript: any[] = [];

      for (let i = 0; i < this.currentlevel.segments.length; i++) {
        const segment = this.currentlevel.segments.get(i);

        let last_bound = 0;
        if (i > 0) {
          last_bound = this.currentlevel.segments.get(i - 1).time.samples;
        }

        const segment_json: any = {
          start: last_bound,
          length: segment.time.samples - last_bound,
          text: segment.transcript
        };

        transcript.push(segment_json);
      }

      data.transcript = transcript;
    }

    return data;
  }

  public saveSegments = () => {
    // make sure, that no saving overhead exist. After saving request wait 1 second
    if (!this.saving) {
      this.saving = true;
      setTimeout(() => {
        this.appStorage.save('annotation', {
          num: this._selectedlevel,
          level: this._annotation.levels[this._selectedlevel].getObj()
        });
        this.saving = false;
      }, 2000);
    }
  };

  public destroy() {
    this.subscrmanager.destroy();

    // set data to null
    this._segments = null;
    this._last_sample = null;
    this._guidelines = null;
    this.saving = false;
    this.filename = '';

    this._feedback = null;

    this._break_marker = null;

    this.state = 'ANNOTATED';

    this._statistic = {
      transcribed: 0,
      empty: 0,
      pause: 0
    };

    this.uiService.elements = [];
  }

  public replaceSingleTags(html: string) {
    html = html.replace(/(<)([^<>]+)(>)/g, (g0, g1, g2) => {
      return `[[[${g2}]]]`;
    });

    html = html.replace(/([<>])/g, (g0, g1) => {
      if (g1 === '<') {
        return '&lt;';
      }
      return '&gt;';
    });

    html = html.replace(/((?:\[\[\[)|(?:]]]))/g, (g0, g1) => {
      if (g1 == '[[[') {
        return '<';
      }

      return '>';
    });

    return html;
  }

  public extractUI(ui_elements: StatisticElem[]): OLogging {
    const now = new Date();
    const result: OLogging = new OLogging(
      '1.0',
      'UTF-8',
      (isNullOrUndefined(this.appStorage.user.project) || this.appStorage.user.project === '') ? 'local' : this.appStorage.user.project,
      now.toUTCString(),
      this._annotation.audiofile.name,
      this._annotation.audiofile.samplerate,
      this._annotation.audiofile.duration,
      []
    );

    if (ui_elements) {
      for (let i = 0; i < ui_elements.length; i++) {
        const elem = ui_elements[i];

        const new_elem = new OLog(
          elem.timestamp,
          elem.type,
          elem.context,
          '',
          elem.playerpos,
          elem.caretpos
        );

        if (elem instanceof MouseStatisticElem) {
          new_elem.value = elem.value;
        } else if (elem instanceof KeyStatisticElem) {
          new_elem.value = (<KeyStatisticElem> elem).value;
        } else {
          new_elem.value = (<StatisticElem> elem).value;
        }

        result.logs.push(new_elem);
      }
    }

    return result;
  }

  public analyse() {
    this._statistic = {
      transcribed: 0,
      empty: 0,
      pause: 0
    };

    for (let i = 0; i < this._annotation.levels[this._selectedlevel].segments.length; i++) {
      const segment = this._annotation.levels[this._selectedlevel].segments.get(i);

      if (segment.transcript !== '') {
        if (this.break_marker !== null && segment.transcript.indexOf(this.break_marker.code) > -1) {
          this._statistic.pause++;
        } else {
          this._statistic.transcribed++;
        }
      } else {
        this._statistic.empty++;
      }
    }
  }

  /**
   * converts raw text of markers to html
   * @param rawtext
   * @returns {string}
   */
  public rawToHTML(rawtext: string): string {
    let result: string = rawtext;

    result = this.replaceMarkersWithHTML(result);

    const result2 = this.replaceSingleTags(result);

    if (rawtext !== '') {
      result = result.replace(/\s+$/g, '&nbsp;');
      result = (result !== '') ? '' + result + '' : '';
    }

    return result;
  }

  /**
   * replace markers of the input string with its html pojection
   * @param input
   * @param use_wrap
   * @returns {string}
   */
  public replaceMarkersWithHTML(input: string): string {
    // TODO optimization possible

    let result = input;
    for (let i = 0; i < this._guidelines.markers.length; i++) {
      const marker = this._guidelines.markers[i];
      const regex = new RegExp(Functions.escapeRegex(marker.code), 'g');
      const code = marker.code.replace(/([[<>])/g, (g0, g1) => {
        switch (g1) {
          case('<'):
            return '&lt;';
          case('>'):
            return '&gt;';
        }
      });

      if (!((marker.icon_url === null || marker.icon_url === undefined) || marker.icon_url === '')) {
        result = result.replace(regex, '<img src=\'' + marker.icon_url + '\' class=\'btn-icon-text\' ' +
          'style=\'height:16px;\' data-marker-code=\'' + code + '\'/>');
      } else {
        // marker is text only
        result = result.replace(regex, code);
      }
    }
    return result;
  }

  public underlineTextRed(rawtext: string, validation: any[]) {
    let result = rawtext;

    interface Pos {
      start: number;
      puffer: string;
    }

    let insertions: Pos[] = [];

    if (validation.length > 0) {
      // prepare insertions
      for (let i = 0; i < validation.length; i++) {
        let insertStart = insertions.find((val) => {
          return val.start === validation[i].start;
        });

        if (isNullOrUndefined(insertStart)) {
          insertStart = {
            start: validation[i].start,
            puffer: '[[[span class=\'val-error\' data-errorcode=\'' + validation[i].code + '\']]]'
          };
          insertions.push(insertStart);
        } else {
          insertStart.puffer += '[[[span class=\'val-error\' data-errorcode=\'' + validation[i].code + '\']]]';
        }

        let insertEnd = insertions.find((val) => {
          return val.start === validation[i].start + validation[i].length;
        });

        if (isNullOrUndefined(insertEnd)) {
          insertEnd = {
            start: insertStart.start + validation[i].length,
            puffer: ''
          };
          insertEnd.puffer = '[[[/span]]]';
          insertions.push(insertEnd);
        } else {
          insertEnd.puffer = '[[[/span]]]' + insertEnd.puffer;
        }
      }

      insertions = insertions.sort(function (a, b) {
        if (a.start === b.start) {
          return 0;
        }
        if (a.start < b.start) {
          return -1;
        }
        if (a.start > b.start) {
          return 1;
        }
      });

      let puffer = '';
      for (let key = 0; key < insertions.length; key++) {
        const offset = puffer.length;
        const pos = insertions[key].start;

        result = Functions.insertString(result, pos + offset, insertions[key].puffer);
        puffer += insertions[key].puffer;
      }
    }
    return result;
  }

  public getErrorDetails(code: string): any {
    if (!isNullOrUndefined(this._guidelines.instructions)) {
      const instructions = this._guidelines.instructions;

      for (let i = 0; i < instructions.length; i++) {
        const instruction = instructions[i];

        for (let j = 0; j < instruction.entries.length; j++) {
          const entry = instruction.entries[j];

          if (entry.code === code) {
            return entry;
          }
        }
      }
    }
    return null;
  }

  public requestSegment(segnumber: number) {
    if (segnumber < this._annotation.levels[this._selectedlevel].segments.length) {
      this.segmentrequested.emit(segnumber);
    } else {
    }
  }

  /**
   * resets the parent object values. Call this function after transcription was saved
   */
  public endTranscription = (destroyaudio: boolean = true) => {
    this.audio.destroy(destroyaudio);
    this.destroy();
  };


  public createNewAnnotation(): OAnnotJSON {
    const level: OLevel = new OLevel('OCTRA_1', 'SEGMENT', []);
    level.items.push(new OSegment(1, 0, this._audiomanager.ressource.info.duration.samples, [(new OLabel('OCTRA_1', ''))]));
    const levels: OLevel[] = [];
    levels.push(level);

    return new OAnnotJSON(this.filename, this._audiomanager.ressource.info.samplerate, levels);
  }

  public htmlToRaw(html: string): string {
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
          for (let j = 0; j < this.guidelines.markers.length; j++) {
            const marker = this.guidelines.markers[j];
            if (attr === marker.code) {
              return jQuery(elem).replaceWith(Functions.escapeHtml(attr));
            }
          }
        } else if (jQuery(elem).attr('class') !== 'val-error') {
          jQuery(elem).remove();
        }
      }
    };

    jQuery.each(dom.children(), replace_func);
    return dom.text();
  }
}
