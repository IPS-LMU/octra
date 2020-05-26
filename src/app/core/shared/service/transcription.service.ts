import {HttpClient} from '@angular/common/http';
import {EventEmitter, Injectable} from '@angular/core';
import {
  Annotation,
  AudioManager,
  Functions,
  isUnset,
  Level,
  OAnnotJSON,
  OAudiofile,
  OLabel,
  OLevel,
  OSegment,
  Segments, SubscriptionManager
} from 'octra-components';
import {AnnotJSONConverter, PartiturConverter, TextConverter} from '../';
import {AppInfo} from '../../../app.info';
import {NavbarService} from '../../gui/navbar/navbar.service';
import {Converter, IFile} from '../../obj/Converters';
import {FeedBackForm} from '../../obj/FeedbackForm/FeedBackForm';
import {AppSettings, ProjectSettings} from '../../obj/Settings';
import {OLog, OLogging} from '../../obj/Settings/logging';
import {KeyStatisticElem} from '../../obj/statistics/KeyStatisticElem';
import {MouseStatisticElem} from '../../obj/statistics/MouseStatisticElem';
import {StatisticElem} from '../../obj/statistics/StatisticElement';
import {AppStorageService, OIDBLevel} from './appstorage.service';
import {AudioService} from './audio.service';
import {SettingsService} from './settings.service';
import {UserInteractionsService} from './userInteractions.service';

declare var validateAnnotation: ((string, any) => any);

@Injectable({
  providedIn: 'root'
})
export class TranscriptionService {
  public tasksBeforeSend: Promise<any>[] = [];
  public defaultFontSize = 14;
  public dataloaded = new EventEmitter<any>();
  public segmentrequested = new EventEmitter<number>();
  public filename = '';
  public levelchanged: EventEmitter<Level> = new EventEmitter<Level>();
  private subscrmanager: SubscriptionManager;
  private _segments: Segments;
  private state = 'ANNOTATED';
  private _audiomanager: AudioManager;

  get audioManager(): AudioManager {
    return this._audiomanager;
  }

  /*
   set segments(value: Segments) {
   this._segments = value;
   }
   */

  public get currentlevel(): Level {
    return this._annotation.levels[this._selectedlevel];
  }

  private _annotation: Annotation;

  get annotation(): Annotation {
    return this._annotation;
  }

  set annotation(value: Annotation) {
    this._annotation = value;
  }

  private _guidelines: any;

  get guidelines(): any {
    return this._guidelines;
  }

  set guidelines(value: any) {
    this._guidelines = value;
  }

  private _audiofile: OAudiofile;

  get audiofile(): OAudiofile {
    return this._audiofile;
  }

  /*
   get segments(): Segments {

   return this._segments;
   }
   */

  private _feedback: FeedBackForm;

  get feedback(): FeedBackForm {
    return this._feedback;
  }

  private _breakMarker: any = null;

  get breakMarker(): any {
    return this._breakMarker;
  }

  set breakMarker(value: any) {
    this._breakMarker = value;
  }

  private _selectedlevel = 0;

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

  private _statistic: any = {
    transcribed: 0,
    empty: 0,
    pause: 0
  };

  get statistic(): any {
    return this._statistic;
  }

  private _validationArray: {
    segment: number,
    validation: any[]
  }[] = [];

  get validationArray(): { segment: number; validation: any[] }[] {
    return this._validationArray;
  }

  private _transcriptValid = false;

  get transcriptValid(): boolean {
    return this._transcriptValid;
  }

  private get app_settings(): AppSettings {
    return this.settingsService.appSettings;
  }

  private get projectsettings(): ProjectSettings {
    return this.settingsService.projectsettings;
  }

  constructor(private audio: AudioService,
              private appStorage: AppStorageService,
              private uiService: UserInteractionsService,
              private navbarServ: NavbarService,
              private settingsService: SettingsService,
              private http: HttpClient) {
    this.subscrmanager = new SubscriptionManager();

    this.subscrmanager.add(
      this.uiService.afteradd.subscribe((elem) => {
        if (this.appStorage.logging) {
          this.appStorage.saveLogItem(elem.getDataClone());
        }
      }));
  }

  public saveSegments = () => {
    // make sure, that no saving overhead exist. After saving request wait 1 second
    if (!isUnset(this._annotation)
      && this._annotation.levels.length > 0
      && !isUnset(this._annotation.levels[this._selectedlevel])) {
      this.appStorage.save('annotation', {
        num: this._selectedlevel,
        level: this._annotation.levels[this._selectedlevel].getObj(this.audioManager.ressource.info.duration)
      });
    } else {
      console.error(new Error('can not save segments because annotation is null'));
    }
  }
  /**
   * resets the parent object values. Call this function after transcription was saved
   */
  public endTranscription = (destroyaudio: boolean = true) => {
    this.audio.destroy(destroyaudio);
    this.destroy();
  }

  public getSegmentFirstLevel(): number {
    for (let i = 0; this.annotation.levels.length; i++) {
      if (this.annotation.levels[i].getTypeString() === 'SEGMENT') {
        return i;
      }
    }
    return -1;
  }

  public validate(rawText: string): any {
    const results = validateAnnotation(rawText, this._guidelines);

    // check if selection is in the raw text
    const sPos = rawText.indexOf('[[[sel-start/]]]');
    const sLen = '[[[sel-start/]]]'.length;
    const ePos = rawText.indexOf('[[[sel-end/]]]');
    const eLen = '[[[sel-end/]]]'.length;

    // look for segment boundaries like {23423424}
    const segRegex = new RegExp(/{[0-9]+}/g);

    for (let i = 0; i < results.length; i++) {
      const validation = results[i];

      if (sPos > -1 && ePos > -1) {
        // check if error is between the selection marks
        if (
          (validation.start >= sPos && validation.start + validation.length <= sPos + sLen) ||
          (validation.start >= ePos && validation.start + validation.length <= ePos + eLen)
        ) {
          // remove
          results.splice(i, 1);
          i--;
        }
      }

      let match = segRegex.exec(rawText);
      while (match != null) {
        if (validation.start >= match.index && validation.start + validation.length <= match.index + match[0].length) {
          // remove
          results.splice(i, 1);
          i--;
        }

        match = segRegex.exec(rawText);
      }
    }

    return results;
  }

  /**
   * metod after audio was loaded
   */
  public load(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._audiomanager = this.audio.audiomanagers[0];

      this.filename = this._audiomanager.ressource.name;

      this._audiofile = new OAudiofile();
      this._audiofile.name = this._audiomanager.ressource.info.fullname;
      this._audiofile.sampleRate = this._audiomanager.ressource.info.sampleRate;
      this._audiofile.duration = this._audiomanager.ressource.info.duration.samples;
      this._audiofile.size = this._audiomanager.ressource.info.size;
      this._audiofile.url = (this.appStorage.usemode === 'online')
        ? `${this.app_settings.audio_server.url}${this.appStorage.audioURL}` : '';

      this._audiofile.url = (this.appStorage.usemode === 'demo')
        ? `${this.appStorage.audioURL}` : this._audiofile.url;
      this._audiofile.type = this._audiomanager.ressource.info.type;

      // overwrite logging option using projectconfig
      if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'demo') {
        this.appStorage.logging = this.settingsService.projectsettings.logging.forced;
      }
      this.uiService.enabled = this.appStorage.logging;

      this.loadSegments().then(
        () => {
          this.selectedlevel = 0;
          this.navbarServ.ressource = this._audiomanager.ressource;
          this.navbarServ.filesize = Functions.getFileSize(this._audiomanager.ressource.size);

          resolve();
        }
      ).catch((err) => {
        reject(err);
      });
    });
  }

  public getTranscriptString(converter: Converter): string {
    let result: IFile;

    if (!(this.annotation === null || this.annotation === undefined)) {
      result = converter.export(
        this.annotation.getObj(this.audioManager.ressource.info.duration),
        this.audiofile, 0
      ).file;

      return result.content;
    }

    return '';
  }

  public loadSegments(): Promise<void> {
    return new Promise<void>(
      (resolve, reject) => {
        new Promise<void>((resolve2) => {
          if (isUnset(this.appStorage.annotation) || this.appStorage.annotation.length === 0) {
            const newLevels = [];
            const levels = this.createNewAnnotation().levels;
            for (let i = 0; i < levels.length; i++) {
              newLevels.push(new OIDBLevel(i + 1, levels[i], i));
            }

            this.appStorage.overwriteAnnotation(newLevels).then(() => {
                if (this.appStorage.usemode === 'online' || this.appStorage.usemode === 'url') {
                  this.appStorage.annotation[this._selectedlevel].level.items = [];

                  if (!isUnset(this.appStorage.serverDataEntry) && !isUnset(this.appStorage.serverDataEntry.transcript)
                    && this.appStorage.serverDataEntry.transcript.length > 0) {
                    // import logs
                    this.appStorage.logs = this.appStorage.serverDataEntry.logtext;

                    // check if servertranscript's segment is empty
                    if (this.appStorage.serverDataEntry.transcript.length === 1 && this.appStorage.serverDataEntry[0].text === '') {
                      this.appStorage.annotation[this.selectedlevel].level.items.push(
                        new OSegment(0, 0, this.audioManager.ressource.info.duration.samples,
                          [new OLabel('OCTRA_1', this.appStorage.prompttext)])
                      );

                      this.appStorage.changeAnnotationLevel(this._selectedlevel,
                        this.appStorage.annotation[this._selectedlevel].level)
                        .then(() => {
                          resolve2();
                        })
                        .catch(
                          (err) => {
                            console.error(`error on overwriting annotation`);
                            console.error(err);
                            resolve2();
                          }
                        );
                    } else {
                      console.log(`read serverData entry...`);
                      this.appStorage.annotation[this._selectedlevel].level.items = [];
                      for (let i = 0; i < this.appStorage.serverDataEntry.transcript.length; i++) {
                        const segT = this.appStorage.serverDataEntry.transcript[i];

                        const oseg = new OSegment(i, segT.start, segT.length, [new OLabel('OCTRA_1', segT.text)]);
                        this.appStorage.annotation[this.selectedlevel].level.items.push(oseg);
                      }
                      console.log(`read serverData read with ${this.appStorage.serverDataEntry.transcript.length} items...`);

                      this.appStorage.changeAnnotationLevel(this._selectedlevel,
                        this.appStorage.annotation[this._selectedlevel].level)
                        .then(() => {
                          resolve2();
                        })
                        .catch(
                          (err) => {
                            console.error(`error on overwriting annotation`);
                            console.error(err);
                            resolve2();
                          }
                        );
                    }
                  } else if (!isUnset(this.appStorage.prompttext) && this.appStorage.prompttext !== ''
                    && typeof this.appStorage.prompttext === 'string') {
                    // prompt text available and server transcript is null
                    // set prompt as new transcript

                    // check if prompttext ist a transcription format like AnnotJSON
                    let converted: OAnnotJSON;
                    for (const converter of AppInfo.converters) {
                      if (converter instanceof AnnotJSONConverter || converter instanceof PartiturConverter) {
                        const result = converter.import({
                          name: this._audiofile.name,
                          content: this.appStorage.prompttext,
                          type: 'text',
                          encoding: 'utf8'
                        }, this._audiofile);

                        if (result !== null && result !== undefined
                          && result.annotjson !== null && result.annotjson.levels.length > 0
                          && result.annotjson.levels[0] !== null
                          && !(converter instanceof TextConverter)) {
                          converted = result.annotjson;
                          break;
                        }
                      }
                    }

                    if (converted === undefined) {
                      this.appStorage.annotation[this.selectedlevel].level.items.push(
                        new OSegment(0, 0, this.audioManager.ressource.info.duration.samples,
                          [new OLabel('OCTRA_1', this.appStorage.prompttext)])
                      );

                      this.appStorage.changeAnnotationLevel(this._selectedlevel,
                        this.appStorage.annotation[this._selectedlevel].level)
                        .then(() => {
                          resolve2();
                        })
                        .catch(
                          (err) => {
                            console.error(`error on overwriting annotation`);
                            console.error(err);
                            resolve2();
                          }
                        );
                    } else {
                      // use imported annotJSON
                      const promises: Promise<any>[] = [];
                      for (let i = 0; i < converted.levels.length; i++) {
                        if (i >= this.appStorage.annotation.length) {
                          this.appStorage.annotation.push(new OIDBLevel(i + 1, converted.levels[i], i));
                        } else {
                          promises.push(this.appStorage.changeAnnotationLevel(i, converted.levels[i]));
                        }
                      }

                      Promise.all(promises).then(() => {
                        resolve2();
                      }).catch((error) => {
                        console.error(error);
                        resolve2();
                      });
                    }
                  } else {
                    resolve2();
                  }
                } else {
                  resolve2();
                }
              }
            ).catch((err) => {
              console.error(err);
              resolve2();
            });
          } else {
            resolve2();
          }
        }).then(() => {
          const annotates = this._audiomanager.ressource.name + this._audiomanager.ressource.extension;

          this._annotation = new Annotation(annotates, this._audiofile);

          if (!(this.appStorage.annotation === null || this.appStorage.annotation === undefined)) {
            // load levels
            console.log(this.appStorage.annotation);
            for (const oidbLevel of this.appStorage.annotation) {
              const level: Level = Level.fromObj(oidbLevel,
                this._audiomanager.sampleRate, this._audiomanager.ressource.info.duration);
              this._annotation.levels.push(level);
            }

            for (const annotationLink of this.appStorage.annotationLinks) {
              this._annotation.links.push(annotationLink.link);
            }

            this._feedback = FeedBackForm.fromAny(this.settingsService.projectsettings.feedback_form, this.appStorage.comment);
            this._feedback.importData(this.appStorage.feedback);

            if ((this.appStorage.comment === null || this.appStorage.comment === undefined)) {
              this.appStorage.comment = '';
            } else {
              this._feedback.comment = this.appStorage.comment;
            }

            if (this.appStorage.logs === null) {
              this.appStorage.clearLoggingData().catch((error) => {
                console.error(error);
              });
              this.uiService.elements = [];
              this.uiService.addElementFromEvent('octra', {value: AppInfo.version}, Date.now(), null, -1, null, null, 'version');
            } else {
              this.uiService.fromAnyArray(this.appStorage.logs);
              this.uiService.addElementFromEvent('octra', {value: AppInfo.version}, Date.now(), null, -1, null, null, 'version');
            }

            this.navbarServ.dataloaded = true;
            this.dataloaded.emit();
          } else {
            reject(Error('annotation object in appStorage is null'));
          }
          resolve();
        });
      }
    );
  }

  public exportDataToJSON(): any {
    let data: any = {};

    if (!(this.annotation === null || this.annotation === undefined)) {
      const logData: OLogging = this.extractUI(this.uiService.elements);

      data = {
        project: ((this.appStorage.user.project === null || this.appStorage.user.project === undefined))
          ? 'NOT AVAILABLE' : this.appStorage.user.project,
        annotator: ((this.appStorage.user.id === null || this.appStorage.user.id === undefined))
          ? 'NOT AVAILABLE' : this.appStorage.user.id,
        transcript: null,
        comment: this._feedback.comment,
        jobno: ((this.appStorage.user.jobno === null || this.appStorage.user.jobno === undefined))
          ? 'NOT AVAILABLE' : this.appStorage.user.jobno,
        quality: (this.settingsService.isTheme('shortAudioFiles'))
          ? this.appStorage.feedback : JSON.stringify(this._feedback.exportData()),
        status: 'ANNOTATED',
        id: this.appStorage.dataID,
        log: logData.getObj()
      };

      if (this.settingsService.isTheme('korbinian')) {
        data.quality = '';
      }

      for (const logElement of data.log) {
        if (logElement.type === 'transcription:segment_exited') {
          logElement.value = JSON.stringify(logElement.value);
        }
      }

      const transcript: any[] = [];

      for (let i = 0; i < this.currentlevel.segments.length; i++) {
        const segment = this.currentlevel.segments.get(i);

        let lastBound = 0;
        if (i > 0) {
          lastBound = Math.round(this.currentlevel.segments.get(i - 1).time.samples);
        }

        const segmentJSON: any = {
          start: lastBound,
          length: segment.time.samples - lastBound,
          text: segment.transcript
        };

        if (i === this.currentlevel.segments.length - 1) {
          segmentJSON.length = this._audiomanager.ressource.info.duration.samples - lastBound;
        }

        transcript.push(segmentJSON);
      }

      data.transcript = transcript;

      // add number of errors as last element to the log
      data.log.push({
        timestamp: Date.now(),
        type: 'errors',
        context: 'transcript',
        value: JSON.stringify(this.validationArray.filter((a) => {
          return a.validation.length > 0;
        }))
      });
    }

    return data;
  }

  public destroy() {
    this.subscrmanager.destroy();

    // set data to null
    this._segments = null;
    this._guidelines = null;
    this.filename = '';

    this._feedback = null;

    this._breakMarker = null;

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
      if (g1 === '[[[') {
        return '<';
      }

      return '>';
    });

    return html;
  }

  public extractUI(uiElements: StatisticElem[]): OLogging {
    const now = new Date();
    const result: OLogging = new OLogging(
      '1.0',
      'UTF-8',
      ((this.appStorage.user.project === null || this.appStorage.user.project === undefined) || this.appStorage.user.project === '')
        ? 'local' : this.appStorage.user.project,
      now.toUTCString(),
      this._annotation.audiofile.name,
      this._annotation.audiofile.sampleRate,
      this._annotation.audiofile.duration,
      []
    );

    if (uiElements) {
      for (const elem of uiElements) {
        const newElem = new OLog(
          elem.timestamp,
          elem.type,
          elem.context,
          '',
          elem.playpos,
          elem.caretpos,
          elem.selection,
          elem.segment
        );

        if (elem instanceof MouseStatisticElem) {
          newElem.value = elem.value;
        } else if (elem instanceof KeyStatisticElem) {
          newElem.value = (elem as KeyStatisticElem).value;
        } else {
          newElem.value = (elem as StatisticElem).value;
        }

        result.logs.push(newElem);
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
        if (this.breakMarker !== null && segment.transcript.indexOf(this.breakMarker.code) > -1) {
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
   */
  public rawToHTML(rawtext: string): string {
    let result: string = rawtext;

    if (rawtext !== '') {
      result = result.replace(/\r?\n/g, ' '); // .replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // replace markers with no wrap

      const markers = this._guidelines.markers;
      // replace all tags that are not markers
      result = result.replace(new RegExp('(<\/?)?([^<>]+)(>)', 'g'), (g0, g1, g2, g3) => {
        g1 = (g1 === undefined) ? '' : g1;
        g2 = (g2 === undefined) ? '' : g2;
        g3 = (g3 === undefined) ? '' : g3;

        // check if its an html tag
        if (g2 === 'img' && g2 === 'span' && g2 === 'div' && g2 === 'i' && g2 === 'b' && g2 === 'u' && g2 === 's') {
          return `[[[${g2}]]]`;
        }

        // check if it's a marker
        for (const marker of markers) {
          if (`${g1}${g2}${g3}` === marker.code) {
            return `[[[${g2}]]]`;
          }
        }

        return `${g1}${g2}${g3}`;
      });

      // replace
      result = result.replace(/([<>])/g, (g0, g1) => {
        if (g1 === '<') {
          return '&lt;';
        }

        return '&gt;';
      });

      result = result.replace(/(\[\[\[)|(]]])/g, (g0, g1, g2) => {
        if (g2 === undefined && g1 !== undefined) {
          return '<';
        } else {
          return '>';
        }
      });

      for (const marker of markers) {
        // replace {<number>} with boundary HTMLElement
        result = result.replace(/\s?{([0-9]+)}\s?/g, (x, g1) => {
          return ' <img src="assets/img/components/transcr-editor/boundary.png" ' +
            'class="btn-icon-text boundary" style="height:16px;" ' +
            'data-samples="' + g1 + '" alt="\[|' + g1 + '|\]"> ';
        });

        // replace markers
        const regex = new RegExp('(\s)*(' + Functions.escapeRegex(marker.code) + ')(\s)*', 'g');
        result = result.replace(regex, (x, g1, g2, g3) => {
          const s1 = (g1) ? g1 : '';
          const s3 = (g3) ? g3 : '';

          let img = '';
          if (!((marker.icon === null || marker.icon === undefined) || marker.icon === '') && (marker.icon.indexOf('.png') > -1
            || marker.icon.indexOf('.jpg') > -1 || marker.icon.indexOf('.gif') > -1)) {
            const markerCode = marker.code.replace(/</g, '&amp;lt;').replace(/>/g, '&amp;gt;');
            img = '<img src=\'' + marker.icon + '\' class=\'btn-icon-text boundary\' style=\'height:16px;\' ' +
              'data-marker-code=\'' + markerCode + '\' alt=\'' + markerCode + '\'/>';
          } else {
            // is text or ut8 symbol
            if (!isUnset(marker.icon) && marker.icon !== '') {
              img = marker.icon;
            } else {
              img = marker.code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
          }

          return s1 + img + s3;
        });
      }

      // replace more than one empty spaces
      result = result.replace(/\s+$/g, '&nbsp;');
    }

    // wrap result with <p>. Missing this would cause the editor fail on marker insertion
    result = (result !== '' && result !== ' ') ? '<p>' + result + '</p>' : '<p><br/></p>';

    return result;
  }

  public underlineTextRed(rawtext: string, validation: any[]) {
    let result = rawtext;

    interface Pos {
      start: number;
      puffer: string;
    }

    const markerPositions = this.getMarkerPositions(rawtext);

    let insertions: Pos[] = [];

    if (validation.length > 0) {
      // prepare insertions
      for (const validationElement of validation) {
        const foundMarker = markerPositions.find(
          (a) => {
            return (validationElement.start > a.start && validationElement.start + validationElement.length < a.end);
          }
        );

        if (foundMarker === undefined) {
          let insertStart = insertions.find((val) => {
            return val.start === validationElement.start;
          });

          if ((insertStart === null || insertStart === undefined)) {
            insertStart = {
              start: validationElement.start,
              puffer: '[[[span class=\'val-error\' data-errorcode=\'' + validationElement.code + '\']]]'
            };
            insertions.push(insertStart);
          } else {
            insertStart.puffer += '[[[span class=\'val-error\' data-errorcode=\'' + validationElement.code + '\']]]';
          }

          let insertEnd = insertions.find((val) => {
            return val.start === validationElement.start + validationElement.length;
          });

          if ((insertEnd === null || insertEnd === undefined)) {
            insertEnd = {
              start: insertStart.start + validationElement.length,
              puffer: ''
            };
            insertEnd.puffer = '[[[/span]]]';
            insertions.push(insertEnd);
          } else {
            insertEnd.puffer = '[[[/span]]]' + insertEnd.puffer;
          }
        }
      }

      insertions = insertions.sort((a, b) => {
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
      for (const insertion of insertions) {
        const offset = puffer.length;
        const pos = insertion.start;

        result = Functions.insertString(result, pos + offset, insertion.puffer);
        puffer += insertion.puffer;
      }
    }
    return result;
  }

  public getErrorDetails(code: string): any {
    if (!(this._guidelines.instructions === null || this._guidelines.instructions === undefined)) {
      const instructions = this._guidelines.instructions;

      for (const instruction of instructions) {
        for (const entry of instructions.entries) {
          if (entry.code === code) {
            entry.description = entry.description.replace(/{{([^{}]+)}}/g, (g0, g1) => {
              return this.rawToHTML(g1).replace(/(<p>)|(<\/p>)/g, '');
            });
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

  public createNewAnnotation(): OAnnotJSON {
    const level: OLevel = new OLevel('OCTRA_1', 'SEGMENT', []);
    level.items.push(new OSegment(1, 0, this._audiomanager.ressource.info.duration.samples, [(new OLabel('OCTRA_1', ''))]));
    const levels: OLevel[] = [];
    levels.push(level);

    return new OAnnotJSON(this.filename, this._audiomanager.ressource.info.sampleRate, levels);
  }

  public htmlToRaw(html: string): string {
    html = '<p>' + html + '</p>';
    const dom = jQuery(html);

    const replaceFunc = (i, elem) => {
      if (jQuery(elem).children() !== null && jQuery(elem).children().length > 0) {
        jQuery.each(jQuery(elem).children(), replaceFunc);
      } else {
        let attr = jQuery(elem).attr('data-marker-code');
        if (elem.type === 'select-one') {
          const value = jQuery(elem).attr('data-value');
          attr += '=' + value;
        }
        if (attr) {
          attr = attr.replace(/((?:&lt;)|(?:&gt;))/g, (g0, g1) => {
            if (g1 === '&lt;') {
              return '<';
            }
            return '>';
          });

          for (const marker of this.guidelines.markers) {
            if (attr === marker.code) {
              return jQuery(elem).replaceWith(Functions.escapeHtml(attr));
            }
          }
        } else if (jQuery(elem).attr('class') !== 'val-error') {
          jQuery(elem).remove();
        }
      }
    };

    jQuery.each(dom.children(), replaceFunc);
    return dom.text();
  }

  public validateAll() {
    this._validationArray = [];

    if (this.appStorage.usemode !== 'url' && (this.appStorage.usemode === 'demo'
      || this.settingsService.projectsettings.octra.validationEnabled)) {
      let invalid = false;

      for (let i = 0; i < this.currentlevel.segments.length; i++) {
        const segment = this.currentlevel.segments.segments[i];

        let segmentValidation = [];

        if (segment.transcript.length > 0) {
          segmentValidation = this.validate(segment.transcript);
        }

        this._validationArray.push(
          {
            segment: i,
            validation: segmentValidation
          }
        );

        if (segmentValidation.length > 0) {
          invalid = true;
        }
      }
      this._transcriptValid = !invalid;
    } else {
      console.log(this.settingsService.projectsettings.octra.validationEnabled);
      console.log(`validationEnabled is disabled`);
      this._transcriptValid = true;
    }
  }

  public getMarkerPositions(rawText: string): { start: number; end: number }[] {
    const result = [];
    let regexStr = '';
    for (let i = 0; i < this._guidelines.markers.length; i++) {
      const marker = this._guidelines.markers[i];
      regexStr += `(${Functions.escapeRegex(marker.code)})`;

      if (i < this._guidelines.markers.length - 1) {
        regexStr += '|';
      }
    }
    const regex = new RegExp(regexStr, 'g');

    let match = regex.exec(rawText);
    while (match != null) {
      result.push({
        start: match.index,
        end: match.index + match[0].length
      });
      match = regex.exec(rawText);
    }

    return result;
  }
}
