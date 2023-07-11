import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import {
  escapeRegex,
  getFileSize,
  hasProperty,
  insertString,
  SubscriptionManager,
} from '@octra/utilities';
import { AppInfo } from '../../../app.info';
import { NavbarService } from '../../component/navbar/navbar.service';
import { FeedBackForm } from '../../obj/FeedbackForm/FeedBackForm';
import { AppSettings } from '../../obj/Settings';
import { OLog, OLogging } from '../../obj/Settings/logging';
import { KeyStatisticElem } from '../../obj/statistics/KeyStatisticElem';
import { MouseStatisticElem } from '../../obj/statistics/MouseStatisticElem';
import { StatisticElem } from '../../obj/statistics/StatisticElement';
import { AppStorageService } from './appstorage.service';
import { AudioService } from './audio.service';
import { SettingsService } from './settings.service';
import { UserInteractionsService } from './userInteractions.service';
import {
  Annotation,
  AnnotationLevelType,
  Converter,
  IFile,
  ImportResult,
  Level,
  OAnnotJSON,
  OAudiofile,
  OIDBLevel,
  OIDBLink,
  OLabel,
  OLevel,
  OSegment,
  SegmentChangeEvent,
  Segments,
} from '@octra/annotation';
import { AudioManager } from '@octra/media';
import { getModeState, LoginMode, RootState } from '../../store';
import { TranslocoService } from '@ngneat/transloco';
import { MaintenanceAPI } from '../../component/maintenance/maintenance-api';
import { interval, Subject, Subscription, timer } from 'rxjs';
import { DateTime } from 'luxon';
import {
  AnnotationStateLevel,
  convertFromLevelObject,
  convertToLevelObject,
  LocalModeState,
  OnlineModeState,
} from '../../store/annotation';
import { AnnotationStoreService } from '../../store/annotation/annotation.store.service';
import { TaskDto } from '@octra/api-types';
import { RoutingService } from './routing.service';

declare let validateAnnotation: (transcript: string, guidelines: any) => any;

@Injectable({
  providedIn: 'root',
})
export class TranscriptionService {
  get currentLevelSegmentChange(): EventEmitter<SegmentChangeEvent> {
    return this._currentLevelSegmentChange;
  }

  public tasksBeforeSend: Promise<any>[] = [];
  public defaultFontSize = 14;
  public dataloaded = new EventEmitter<any>();
  public segmentrequested = new EventEmitter<number>();
  public filename = '';
  public levelchanged: EventEmitter<Level> = new EventEmitter<Level>();
  public annotationChanged: EventEmitter<void> = new EventEmitter<void>();
  private subscrmanager: SubscriptionManager<Subscription>;
  private _segments!: Segments;
  private state = 'ANNOTATED';
  private _audiomanager!: AudioManager;
  private _currentLevelSegmentChange = new EventEmitter<SegmentChangeEvent>();
  public alertTriggered: Subject<{
    type: 'danger' | 'warning' | 'info' | 'success';
    data: string | any;
    unique: boolean;
    duration?: number;
  }>;
  private maintenanceChecker!: Subscription;

  get audioManager(): AudioManager {
    return this._audiomanager;
  }

  /*
   set segments(value: Segments) {
   this._segments = value;
   }
   */

  public get currentlevel(): Level | undefined {
    if (this._selectedlevel === undefined || this._selectedlevel < 0) {
      return this._annotation?.levels[0];
    }
    return this._annotation?.levels[this._selectedlevel];
  }

  private _annotation!: Annotation;

  get annotation(): Annotation {
    return this._annotation;
  }

  get guidelines(): any | undefined {
    return getModeState(this.appStorage.snapshot)?.guidelines?.selected?.json;
  }

  private _audiofile!: OAudiofile;

  get audiofile(): OAudiofile {
    return this._audiofile;
  }

  /*
   get segments(): Segments {

   return this._segments;
   }
   */

  private _feedback!: FeedBackForm;

  get feedback(): FeedBackForm {
    return this._feedback;
  }

  private _breakMarker: any = undefined;

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
    if (
      value > -1 &&
      value < this.annotation.levels.length &&
      this.annotation.levels[value].getTypeString() === 'SEGMENT'
    ) {
      this._selectedlevel = value;
    } else {
      this._selectedlevel = this.getSegmentFirstLevel();
    }
    this.levelchanged.emit(this._annotation.levels[this._selectedlevel]);
    this.listenForSegmentChanges();
  }

  private _statistic: any = {
    transcribed: 0,
    empty: 0,
    pause: 0,
  };

  get statistic(): any {
    return this._statistic;
  }

  private _validationArray: {
    segment: number;
    validation: any[];
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

  constructor(
    private audio: AudioService,
    private appStorage: AppStorageService,
    private uiService: UserInteractionsService,
    private navbarServ: NavbarService,
    private settingsService: SettingsService,
    private languageService: TranslocoService,
    private annotationStoreService: AnnotationStoreService,
    private routingService: RoutingService,
    private http: HttpClient
  ) {
    this.subscrmanager = new SubscriptionManager<Subscription>();
    this.alertTriggered = new Subject<{
      type: 'danger' | 'warning' | 'info' | 'success';
      data: string | any;
      unique: boolean;
      duration?: number;
    }>();
  }

  /**
   * init is called as soon as annotation is started
   */
  init() {
    this.subscrmanager.add(
      this.uiService.afteradd.subscribe((elem) => {
        if (this.appStorage.logging) {
          this.appStorage.saveLogItem(elem.getDataClone());
        }
      })
    );

    this._currentLevelSegmentChange = new EventEmitter<SegmentChangeEvent>();
    if (
      this.settingsService.appSettings !== undefined &&
      hasProperty(
        this.settingsService.appSettings.octra,
        'maintenanceNotification'
      ) &&
      this.settingsService.appSettings.octra.maintenanceNotification.active ===
        'active'
    ) {
      const maintenanceAPI = new MaintenanceAPI(
        this.settingsService.appSettings.octra.maintenanceNotification.apiURL,
        this.http
      );

      maintenanceAPI
        .readMaintenanceNotifications(24)
        .then((notification) => {
          // only check in interval if there is a pending maintenance in the next 24 hours
          if (notification !== undefined) {
            const readNotification = () => {
              // notify after 15 minutes one hour before the maintenance begins
              maintenanceAPI
                .readMaintenanceNotifications(1)
                .then((notification2) => {
                  if (notification2 !== undefined) {
                    this.alertTriggered.next({
                      type: 'warning',
                      data:
                        '⚠️ ' +
                        this.languageService.translate('maintenance.in app', {
                          start: DateTime.fromISO(notification.begin)
                            .setLocale(this.appStorage.language)
                            .toLocaleString(DateTime.DATETIME_SHORT),
                          end: DateTime.fromISO(notification.end)
                            .setLocale(this.appStorage.language)
                            .toLocaleString(DateTime.DATETIME_SHORT),
                        }),
                      unique: true,
                      duration: 60,
                    });
                  } else {
                    this.subscrmanager.removeByTag('maintenance');
                  }
                })
                .catch(() => {
                  // ignore
                });
            };
            this.subscrmanager.add(
              timer(5000).subscribe(() => {
                readNotification();
              })
            );

            if (this.maintenanceChecker !== undefined) {
              this.maintenanceChecker.unsubscribe();
            }
            // run each 15 minutes
            this.maintenanceChecker = interval(15 * 60000).subscribe(
              readNotification
            );
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }

  public saveSegments = () => {
    // make sure, that no saving overhead exist. After saving request wait 1 second
    if (
      this._annotation !== undefined &&
      this._annotation.levels.length > 0 &&
      this._annotation.levels[this._selectedlevel] !== undefined
    ) {
      const level = this.currentlevel;

      this.appStorage.save('annotation', {
        num: this._selectedlevel,
        level: convertFromLevelObject(
          level!,
          this._audiomanager.resource.info.duration
        ),
      });
    } else {
      console.error(
        new Error('can not save segments because annotation is undefined')
      );
    }
  };

  /***
   * destroys audio service and transcr service. Call this after quit.
   * @param destroyaudio
   */
  public endTranscription = (destroyaudio: boolean = true) => {
    this.audio.destroy(destroyaudio);
    this.destroy();
  };

  public getSegmentFirstLevel(): number {
    for (let i = 0; this.annotation.levels.length; i++) {
      if (this.annotation.levels[i].getTypeString() === 'SEGMENT') {
        return i;
      }
    }
    return -1;
  }

  public validate(rawText: string): any {
    const results = validateAnnotation(rawText, this.guidelines);

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
          (validation.start >= sPos &&
            validation.start + validation.length <= sPos + sLen) ||
          (validation.start >= ePos &&
            validation.start + validation.length <= ePos + eLen)
        ) {
          // remove
          results.splice(i, 1);
          i--;
        }
      }

      let match = segRegex.exec(rawText);
      while (match != undefined) {
        if (
          validation.start >= match.index &&
          validation.start + validation.length <= match.index + match[0].length
        ) {
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
  public async load(state: RootState): Promise<void> {
    if (this.audio.audiomanagers.length > 0) {
      const modeState = getModeState(state);
      this._audiomanager = this.audio.audiomanagers[0];

      this.filename = modeState!.audio.fileName;

      this._audiofile = new OAudiofile();
      this._audiofile.name = modeState!.audio.fileName;
      this._audiofile.sampleRate = this._audiomanager.resource.info.sampleRate;
      this._audiofile.duration =
        this._audiomanager.resource.info.duration.samples;
      this._audiofile.size = this._audiomanager.resource.info.size;

      this._audiofile.url =
        state.application.mode === LoginMode.DEMO
          ? `` // TODO DEMO ensure URL
          : modeState!.audio!.file!.url!;
      this._audiofile.type = this._audiomanager.resource.info.type;
      this.uiService.enabled = this.appStorage.logging;

      await this.loadSegments(modeState!, state);

      this._selectedlevel = 0;
      this.navbarServ.ressource = this._audiomanager.resource;
      this.navbarServ.filesize = getFileSize(
        this._audiomanager.resource.size!
      )!;

      this.subscrmanager.removeByTag('idbAnnotationChange');
      this.subscrmanager.add(
        this.appStorage.annotationChanged.subscribe((state) => {
          this.updateAnnotation(
            state.transcript.levels,
            state.transcript.links
          );
        }),
        'idbAnnotationChange'
      );
    } else {
      console.error(`no audio managers`);
      alert('an error occured. Please reload this page');
      throw new Error('no audio managers');
    }
  }

  public getTranscriptString(converter: Converter): string {
    let result: IFile;

    if (!(this.annotation === undefined)) {
      result = converter.export(
        this.annotation.getObj(this.audioManager.resource.info.duration)!,
        this.audiofile!,
        0
      )!.file!;

      return result.content;
    }

    return '';
  }

  public async loadSegments(
    modeState: OnlineModeState | LocalModeState,
    rootState: RootState
  ): Promise<void> {
    if (
      modeState.transcript.levels === undefined ||
      modeState.transcript.levels.length === 0
    ) {
      let newLevels: OIDBLevel[] = [];
      let newLinks: OIDBLink[] = [];
      const newAnnotJSON = this.createNewAnnotation();
      const levels = newAnnotJSON.levels;
      for (let i = 0; i < levels.length; i++) {
        newLevels.push(new OIDBLevel(i + 1, levels[i], i));
      }

      for (let i = 0; i < newAnnotJSON.links.length; i++) {
        newLinks.push(new OIDBLink(i + 1, newAnnotJSON.links[i]));
      }

      if (
        rootState.application.mode === LoginMode.ONLINE ||
        rootState.application.mode === LoginMode.URL
      ) {
        let annotResult: ImportResult | undefined;
        const task: TaskDto | undefined = modeState.onlineSession?.task;

        const serverTranscript = task
          ? this.annotationStoreService.getTranscriptFromIO(task.inputs)
          : '';

        // import logs
        this.annotationStoreService.setLogs(
          task?.log,
          rootState.application.mode
        );
        if (serverTranscript) {
          // check if it's AnnotJSON
          annotResult =
            this.annotationStoreService.convertFromSupportedConverters(
              AppInfo.converters,
              {
                name: `${this._audiomanager.resource.info.name}_annot.json`,
                content: serverTranscript.content,
                type: serverTranscript.fileType!,
                encoding: 'utf-8',
              },
              {
                name: this._audiomanager.resource.info.fullname,
                arraybuffer: this._audiomanager.resource.arraybuffer!,
                size: this._audiomanager.resource.info.size,
                duration: this._audiomanager.resource.info.duration.samples,
                sampleRate: this._audiomanager.resource.info.sampleRate,
                url: this._audiomanager.resource.info.url!,
                type: this._audiomanager.resource.info.type,
              }
            );

          // import servertranscript
          if (annotResult && annotResult.annotjson) {
            newLevels = [];
            newLinks = [];

            for (let i = 0; i < annotResult.annotjson.levels.length; i++) {
              const level = annotResult.annotjson.levels[i];
              newLevels.push(new OIDBLevel(i + 1, level, i));
            }
            for (let i = 0; i < annotResult.annotjson.links.length; i++) {
              const link = annotResult.annotjson.links[i];
              newLinks.push(new OIDBLink(i + 1, link));
            }
          }
        }

        if (!annotResult) {
          // no transcript found
          if (task) {
            const textInput = this.annotationStoreService.getTranscriptFromIO(
              task.inputs
            );
            if (textInput) {
              // prompt text available and server transcript is undefined
              // set prompt as new transcript

              // check if prompttext ist a transcription format like AnnotJSON
              const converted: ImportResult | undefined =
                this.annotationStoreService.convertFromSupportedConverters(
                  AppInfo.converters,
                  {
                    name: this._audiofile.name,
                    content: textInput.content,
                    type: 'text',
                    encoding: 'utf8',
                  },
                  this._audiofile
                );

              if (converted === undefined) {
                // prompttext is raw text
                newLevels[0].level.items[0].labels[0] = new OLabel(
                  'OCTRA_1',
                  textInput.content
                );
              } else if (converted.annotjson) {
                // use imported annotJSON
                for (let i = 0; i < converted.annotjson.levels.length; i++) {
                  if (i >= newLevels.length) {
                    newLevels.push(
                      new OIDBLevel(i + 1, converted.annotjson.levels[i], i)
                    );
                  } else {
                    newLevels[i].level.name =
                      converted.annotjson.levels[i].name;
                    newLevels[i].level.type =
                      converted.annotjson.levels[i].type;
                    newLevels[i].level.items =
                      converted.annotjson.levels[i].items;
                  }
                }
              }
            }
          }
        }
      }

      this.appStorage.overwriteAnnotation(newLevels, newLinks, true);
      this._annotation = new Annotation(
        this._audiofile.name,
        this._audiofile,
        newLevels.map((a) =>
          Level.fromObj(
            a,
            this._audiofile.sampleRate,
            this.audioManager.createSampleUnit(this._audiofile.duration)
          )
        )
      );
    } else {
      const annotates =
        this._audiomanager.resource.name +
        this._audiomanager.resource.extension;
      this._annotation = new Annotation(annotates, this._audiofile);

      if (this.appStorage.annotationLevels !== undefined) {
        this.updateAnnotation(
          this.appStorage.annotationLevels,
          this.appStorage.annotationLinks
        );

        if (this.settingsService.projectsettings) {
          this._feedback = FeedBackForm.fromAny(
            this.settingsService.projectsettings.feedback_form,
            this.appStorage.comment
          );
        }
        this._feedback.importData(this.appStorage.feedback);

        if (this.appStorage.comment === undefined) {
          this.appStorage.comment = '';
        } else {
          this._feedback.comment = this.appStorage.comment;
        }

        if (this.appStorage.logs === undefined) {
          this.appStorage.clearLoggingDataPermanently();
          this.uiService.elements = [];
        } else if (Array.isArray(this.appStorage.logs)) {
          this.uiService.fromAnyArray(this.appStorage.logs);
        }
        this.uiService.addElementFromEvent(
          'octra',
          { value: AppInfo.version },
          Date.now(),
          undefined,
          -1,
          undefined,
          undefined,
          'version'
        );

        // this.navbarServ.dataloaded = true;
        this.dataloaded.emit();
      } else {
        throw new Error('annotation object in appStorage is undefined');
      }
    }
  }

  private updateAnnotation(levels: AnnotationStateLevel[], links: OIDBLink[]) {
    // load levels
    const annotation = new Annotation(
      this._annotation.annotates,
      this._annotation.audiofile,
      []
    );

    for (const annotationStateLevel of levels) {
      const level = convertToLevelObject(
        annotationStateLevel,
        this.audioManager.sampleRate,
        this.audioManager.resource.info.duration.clone()
      );
      annotation.levels.push(level);
    }

    for (const annotationLink of links) {
      annotation.links.push(annotationLink.link);
    }

    this._annotation = annotation;
    this.listenForSegmentChanges();
    this.annotationChanged.emit();
  }

  private listenForSegmentChanges() {
    this.subscrmanager.removeByTag('segmentchange');
    this.subscrmanager.add(
      this.currentlevel!.segments.onsegmentchange.subscribe((event) => {
        this._currentLevelSegmentChange.emit(event);
      }),
      'segmentchange'
    );
  }

  public destroy() {
    this.subscrmanager.destroy();

    // set data to undefined
    this._segments = undefined as any;
    this.filename = '';

    this._feedback = undefined as any;

    this._breakMarker = undefined;

    this.state = 'ANNOTATED';

    this._statistic = {
      transcribed: 0,
      empty: 0,
      pause: 0,
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
      this.appStorage.onlineSession?.currentProject?.name === undefined
        ? 'local'
        : this.appStorage.onlineSession?.currentProject?.name,
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
      pause: 0,
    };

    for (
      let i = 0;
      i < this._annotation.levels[this._selectedlevel].segments.length;
      i++
    ) {
      const segment =
        this._annotation.levels[this._selectedlevel].segments.get(i);

      if (segment!.transcript !== '') {
        if (
          this.breakMarker !== undefined &&
          segment!.transcript.indexOf(this.breakMarker.code) > -1
        ) {
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

      const markers = this.guidelines.markers;
      // replace all tags that are not markers
      result = result.replace(
        new RegExp(/(<\/?)?([^<>]+)(>)/, 'g'),
        (g0, g1, g2, g3) => {
          g1 = g1 === undefined ? '' : g1;
          g2 = g2 === undefined ? '' : g2;
          g3 = g3 === undefined ? '' : g3;

          // check if its an html tag
          if (
            g2 === 'img' &&
            g2 === 'span' &&
            g2 === 'div' &&
            g2 === 'i' &&
            g2 === 'b' &&
            g2 === 'u' &&
            g2 === 's'
          ) {
            return `[[[${g2}]]]`;
          }

          // check if it's a marker
          for (const marker of markers) {
            if (`${g1}${g2}${g3}` === marker.code) {
              return `[[[${g2}]]]`;
            }
          }

          return `${g1}${g2}${g3}`;
        }
      );

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
          return (
            ' <img src="assets/img/components/transcr-editor/boundary.png" ' +
            'class="btn-icon-text boundary" style="height:16px;" ' +
            'data-samples="' +
            g1 +
            '" alt="[|' +
            g1 +
            '|]"> '
          );
        });

        // replace markers
        const regex = new RegExp(
          '( )*(' + escapeRegex(marker.code) + ')( )*',
          'g'
        );
        result = result.replace(regex, (x, g1, g2, g3) => {
          const s1 = g1 ? g1 : '';
          const s3 = g3 ? g3 : '';

          let img = '';
          if (
            !(marker.icon === undefined || marker.icon === '') &&
            (marker.icon.indexOf('.png') > -1 ||
              marker.icon.indexOf('.jpg') > -1 ||
              marker.icon.indexOf('.gif') > -1)
          ) {
            const markerCode = marker.code
              .replace(/</g, '&amp;lt;')
              .replace(/>/g, '&amp;gt;');
            img =
              "<img src='" +
              marker.icon +
              "' class='btn-icon-text boundary' style='height:16px;' " +
              "data-marker-code='" +
              markerCode +
              "' alt='" +
              markerCode +
              "'/>";
          } else {
            // is text or ut8 symbol
            if (marker.icon !== undefined && marker.icon !== '') {
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
    result =
      result !== '' && result !== ' '
        ? '<p>' + result + '</p>'
        : '<p><br/></p>';

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
        const foundMarker = markerPositions.find((a) => {
          return (
            validationElement.start > a.start &&
            validationElement.start + validationElement.length < a.end
          );
        });

        if (foundMarker === undefined) {
          let insertStart = insertions.find((val) => {
            return val.start === validationElement.start;
          });

          if (insertStart === undefined) {
            insertStart = {
              start: validationElement.start,
              puffer:
                "[[[span class='val-error' data-errorcode='" +
                validationElement.code +
                "']]]",
            };
            insertions.push(insertStart);
          } else {
            insertStart.puffer +=
              "[[[span class='val-error' data-errorcode='" +
              validationElement.code +
              "']]]";
          }

          let insertEnd = insertions.find((val) => {
            return (
              val.start === validationElement.start + validationElement.length
            );
          });

          if (insertEnd === undefined) {
            insertEnd = {
              start: insertStart.start + validationElement.length,
              puffer: '',
            };
            insertEnd.puffer = '[[[/span]]]';
            insertions.push(insertEnd);
          } else {
            insertEnd.puffer = '[[[/span]]]' + insertEnd.puffer;
          }
        }
      }

      insertions = insertions.sort((a: Pos, b: Pos) => {
        if (a.start === b.start) {
          return 0;
        } else if (a.start < b.start) {
          return -1;
        }
        return 1;
      });

      let puffer = '';
      for (const insertion of insertions) {
        const offset = puffer.length;
        const pos = insertion.start;

        result = insertString(result, pos + offset, insertion.puffer);
        puffer += insertion.puffer;
      }
    }
    return result;
  }

  public getErrorDetails(code: string): any {
    if (this.guidelines.instructions !== undefined) {
      const instructions = this.guidelines.instructions;

      for (const instruction of instructions) {
        if (
          instruction.entries !== undefined &&
          Array.isArray(instruction.entries)
        ) {
          for (const entry of instruction.entries) {
            const newEntry = { ...entry };
            if (newEntry.code === code) {
              newEntry.description = newEntry.description.replace(
                /{{([^{}]+)}}/g,
                (g0: string, g1: string) => {
                  return this.rawToHTML(g1).replace(/(<p>)|(<\/p>)/g, '');
                }
              );
              return newEntry;
            }
          }
        }
      }
    }
    return undefined;
  }

  public requestSegment(segnumber: number) {
    if (
      segnumber < this._annotation.levels[this._selectedlevel].segments.length
    ) {
      this.segmentrequested.emit(segnumber);
    }
  }

  public createNewAnnotation(): OAnnotJSON {
    const level: OLevel = new OLevel(
      'OCTRA_1',
      AnnotationLevelType.SEGMENT,
      []
    );
    level.items.push(
      new OSegment(1, 0, this._audiomanager.resource.info.duration.samples, [
        new OLabel('OCTRA_1', ''),
      ])
    );
    const levels: OLevel[] = [];
    levels.push(level);

    return new OAnnotJSON(
      this.filename,
      this._audiomanager.resource.info.sampleRate,
      levels
    );
  }

  public validateAll() {
    this._validationArray = [];

    if (
      this.appStorage.useMode !== LoginMode.URL &&
      (this.appStorage.useMode === LoginMode.DEMO ||
        this.settingsService?.projectsettings?.octra?.validationEnabled ===
          true)
    ) {
      let invalid = false;

      for (let i = 0; i < this.currentlevel!.segments.length; i++) {
        const segment = this.currentlevel!.segments.segments[i];

        let segmentValidation = [];

        if (segment.transcript.length > 0) {
          segmentValidation = this.validate(segment.transcript);
        }

        this._validationArray.push({
          segment: i,
          validation: segmentValidation,
        });

        if (segmentValidation.length > 0) {
          invalid = true;
        }
      }
      this._transcriptValid = !invalid;
    } else {
      this._transcriptValid = true;
    }
  }

  public getMarkerPositions(rawText: string): { start: number; end: number }[] {
    const result = [];
    let regexStr = '';
    for (let i = 0; i < this.guidelines.markers.length; i++) {
      const marker = this.guidelines.markers[i];
      regexStr += `(${escapeRegex(marker.code)})`;

      if (i < this.guidelines.markers.length - 1) {
        regexStr += '|';
      }
    }
    const regex = new RegExp(regexStr, 'g');

    let match = regex.exec(rawText);
    while (match != undefined) {
      result.push({
        start: match.index,
        end: match.index + match[0].length,
      });
      match = regex.exec(rawText);
    }

    return result;
  }
}
