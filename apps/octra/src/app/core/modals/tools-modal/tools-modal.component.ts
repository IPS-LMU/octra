import { NgClass } from '@angular/common';
import { Component, ElementRef, inject, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { OctraAnnotationSegmentLevel } from '@octra/annotation';
import { OctraUtilitiesModule } from '@octra/ngx-utilities';
import { insertString, last } from '@octra/utilities';
import { AudioCutter, IntArray } from '@octra/web-media';
import { fadeInExpandOnEnterAnimation, fadeOutCollapseOnLeaveAnimation } from 'angular-animations';
import { strToU8, zip, zipSync } from 'fflate';
import { interval } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { JSONConverter, TextTableConverter } from '../../obj/tools/audio-cutting/cutting-format';
import { AudioService, SettingsService, UserInteractionsService } from '../../shared/service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { NamingDragAndDropComponent } from '../../tools/naming-drag-and-drop/naming-drag-and-drop.component';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import { OctraModalService } from '../octra-modal.service';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-tools-modal',
  templateUrl: './tools-modal.component.html',
  styleUrls: ['./tools-modal.component.scss'],
  animations: [
    fadeOutCollapseOnLeaveAnimation(),
    fadeInExpandOnEnterAnimation(),
  ],
  imports: [
    NgClass,
    FormsModule,
    NgbTooltip,
    TranslocoPipe,
    OctraUtilitiesModule,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ToolsModalComponent
  extends OctraModal
  implements OnDestroy, OnInit
{
  private sanitizer = inject(DomSanitizer);
  private modalsService = inject(OctraModalService);
  annotationStoreService = inject(AnnotationStoreService);
  audio = inject(AudioService);
  transloco = inject(TranslocoService);
  protected settings = inject(SettingsService);
  protected override activeModal: NgbActiveModal;

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: true,
    scrollable: true,
    size: 'xl',
    fullscreen: 'md',
  };

  public parentformat: {
    download: string;
    uri: SafeUrl;
  } = {
    download: '',
    uri: '',
  };
  public converters = AppInfo.converters;

  public tools: {
    audioCutting: {
      opened: boolean;
      selectedMethod: string;
      progress: number;
      result: {
        url?: SafeResourceUrl;
        filename: string;
      };
      status: string;
      message: string;
      progressbarType: string;
      showConfigurator: boolean;
      subscriptionIDs: number[];
      exportFormats: {
        label: string;
        value: string;
        selected: boolean;
      }[];
      clientStreamHelper?: any;
      zippingSpeed: number;
      archiveStructure?: any;
      cuttingSpeed: number;
      cuttingTimeLeft: number;
      timeLeft: number;
      cutter?: AudioCutter;
    };
    combinePhrases: {
      opened: boolean;
      status: string;
      message: string;
      showOptions: boolean;
      options: {
        minSilenceLength: number;
        maxWordsPerSegment: number;
      };
    };
    regReplace: {
      opened: boolean;
      status: string;
      pattern: string;
      replacement: string;
      levels: Record<string, boolean>;
      results: {
        name: string;
        matches: {
          unitID: number;
          replacements: {
            start: number;
            length: number;
          }[];
          html: string;
        }[];
      }[];
    };
  } = {
    audioCutting: {
      opened: false,
      selectedMethod: 'client',
      progress: 0,
      result: {
        filename: '',
      },
      status: 'idle',
      message: '',
      progressbarType: 'info' as any,
      showConfigurator: false,
      subscriptionIDs: [-1, -1, -1],
      exportFormats: [
        {
          label: 'TextTable',
          value: 'textTable',
          selected: true,
        },
        {
          label: 'JSON',
          value: 'json',
          selected: true,
        },
      ],
      clientStreamHelper: undefined,
      zippingSpeed: -1,
      archiveStructure: undefined,
      cuttingSpeed: -1,
      cuttingTimeLeft: 0,
      timeLeft: 0,
      cutter: undefined,
    },
    combinePhrases: {
      opened: false,
      status: 'idle',
      message: '',
      showOptions: false,
      options: {
        minSilenceLength: 100,
        maxWordsPerSegment: 10,
      },
    },
    regReplace: {
      opened: false,
      status: 'idle',
      pattern: '(a|e)',
      replacement: '[$1]',
      levels: {},
      results: [],
    },
  };

  @ViewChild('namingConvention', { static: false })
  namingConvention!: NamingDragAndDropComponent;
  @ViewChild('content', { static: false }) contentElement!: ElementRef;

  @Input() uiService!: UserInteractionsService;
  protected data = undefined;

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  get isCombinePhrasesSettingsValid(): boolean {
    return (
      Number.isInteger(this.tools.combinePhrases.options.minSilenceLength) &&
      Number.isInteger(this.tools.combinePhrases.options.maxWordsPerSegment) &&
      this.tools.combinePhrases.options.minSilenceLength >= 20 &&
      this.tools.combinePhrases.options.maxWordsPerSegment >= 0
    );
  }

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('toolsModal', activeModal);

    this.activeModal = activeModal;
  }

  onHidden() {
    this.tools.audioCutting.status = 'idle';
    this.tools.audioCutting.progressbarType = 'info';
    this.tools.audioCutting.progressbarType = 'info';
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.result.filename = '';
    this.tools.audioCutting.result.url = undefined;
    this.tools.audioCutting.opened = false;
    this.tools.audioCutting.subscriptionIDs = [-1, -1];
    this.subscriptionManager.destroy();

    if (this.tools.audioCutting.result.url !== undefined) {
      window.URL.revokeObjectURL(this.tools.audioCutting.result.url as string);
    }

    if (this.parentformat.uri !== undefined) {
      const url = this.parentformat.uri.toString();
      window.URL.revokeObjectURL(url);
    }
  }

  public splitAudio() {
    this.splitAudioClient();
  }

  public splitAudioClient() {
    const cutList: any[] = [];
    let startSample = 0;
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.progressbarType = 'info';
    this.tools.audioCutting.result.url = undefined;

    if (!this.annotationStoreService.transcript?.currentLevel) {
      return;
    }
    if (
      this.annotationStoreService.transcript.currentLevel instanceof
      OctraAnnotationSegmentLevel
    ) {
      for (
        let i = 0;
        i < this.annotationStoreService.transcript.currentLevel.items.length;
        i++
      ) {
        const segment =
          this.annotationStoreService.transcript.currentLevel.items[i]!;

        let sampleDur = segment.time.samples - startSample;

        if (
          startSample + sampleDur >
          this.audio.audiomanagers[0].resource.info.duration.samples
        ) {
          console.error(`invalid sampleDur!!`);
          sampleDur =
            this.audio.audiomanagers[0].resource.info.duration.samples -
            startSample;
        }

        cutList.push({
          number: i,
          sampleStart: startSample,
          sampleDur,
          transcript: segment.getFirstLabelWithoutName('Speaker')?.value,
        });
        startSample = segment.time.samples;
      }
    }

    // tasks = segments to cut + one for zipping
    let overallTasks = cutList.length + 1;

    if (this.tools.audioCutting.exportFormats[0].selected) {
      // TextTable selected
      overallTasks++;
    }
    if (this.tools.audioCutting.exportFormats[1].selected) {
      // JSON selected
      overallTasks++;
    }

    // start cutting
    this.tools.audioCutting.cutter = new AudioCutter(
      this.audio.audioManager.resource.info,
    );

    let totalSize = 0;
    let cuttingStarted = 0;

    this.tools.audioCutting.subscriptionIDs[1] = this.subscribe(
      this.tools.audioCutting.cutter.onaudiocut,
      {
        next: (status: {
          finishedSegments: number;
          fileName: string;
          intArray: IntArray;
        }) => {
          this.tools.audioCutting.progress = Math.round(
            (status.finishedSegments / overallTasks) * 100,
          );
          if (this.tools.audioCutting.archiveStructure === undefined) {
            this.tools.audioCutting.archiveStructure = {};
          }
          this.tools.audioCutting.archiveStructure[status.fileName + '.wav'] =
            status.intArray;
          totalSize += status.intArray.byteLength / 2;

          if (this.tools.audioCutting.cuttingSpeed < 0) {
            const now = Date.now();
            this.tools.audioCutting.cuttingSpeed =
              (now - cuttingStarted) / 1000 / status.intArray.length;

            const rest =
              this.audio.audioManager.resource.arraybuffer!.byteLength -
              totalSize;
            this.tools.audioCutting.cuttingTimeLeft =
              this.tools.audioCutting.cuttingSpeed * rest;

            const zippingSpeed = this.tools.audioCutting.zippingSpeed;
            this.tools.audioCutting.timeLeft = Math.ceil(
              (this.tools.audioCutting.cuttingTimeLeft +
                this.audio.audioManager.resource.arraybuffer!.byteLength *
                  zippingSpeed +
                10) *
                1000,
            );

            this.tools.audioCutting.subscriptionIDs[2] = this.subscribe(
              interval(1000),
              () => {
                this.tools.audioCutting.timeLeft -= 1000;
              },
            );
          }

          if (status.finishedSegments === cutList.length) {
            // all segments cutted
            let finished = cutList.length;
            let lastCheck = -1;

            if (this.tools.audioCutting.exportFormats[0].selected) {
              // add TextTable
              const converter = new TextTableConverter();
              const content = converter.exportList(
                cutList,
                this.audio.audioManager.resource.info,
                this.audio.audioManager.resource.info.fullname,
                this.namingConvention.namingConvention,
              );

              this.tools.audioCutting.archiveStructure[
                this.audio.audioManager.resource.info.name + '_meta.txt'
              ] = strToU8(content);
              finished++;
            }

            if (this.tools.audioCutting.exportFormats[1].selected) {
              // add JSON
              const converter = new JSONConverter();
              const content = converter.exportList(
                cutList,
                this.audio.audioManager.resource.info,
                this.audio.audioManager.resource.info.fullname,
                this.namingConvention.namingConvention,
              );

              this.tools.audioCutting.archiveStructure[
                this.audio.audioManager.resource.info.name + '_meta.json'
              ] = strToU8(JSON.stringify(content, undefined, 2));
              finished++;
            }

            let sizeProcessed = 0;
            const startZipping = Date.now();
            zip(
              this.tools.audioCutting.archiveStructure,
              { level: 9 },
              (error, data) => {
                if (!error) {
                  if (sizeProcessed === 0) {
                    // first process
                    if (this.tools.audioCutting.subscriptionIDs[2] > -1) {
                      this.subscriptionManager.removeById(
                        this.tools.audioCutting.subscriptionIDs[2],
                      );
                      this.tools.audioCutting.subscriptionIDs[2] = -1;
                    }
                    this.tools.audioCutting.cuttingSpeed = -1;
                    this.tools.audioCutting.zippingSpeed = -1;
                  }

                  sizeProcessed += data.length;
                  const overAllProgress = sizeProcessed / totalSize;
                  // data is a Uint8Array because that's the type asked in generateInternalStream
                  // metadata contains for example currentFile and percent, see the generateInternalStream doc.
                  this.tools.audioCutting.progress = Number(
                    (
                      ((finished + overAllProgress) / overallTasks) *
                      100
                    ).toFixed(2),
                  );
                  if (Date.now() - lastCheck >= 1000) {
                    if (sizeProcessed > 1024 * 1024 * 2) {
                      this.tools.audioCutting.timeLeft =
                        ((Date.now() - startZipping) / sizeProcessed) *
                        (totalSize - sizeProcessed);
                    }

                    lastCheck = Date.now();
                  }

                  this.tools.audioCutting.status = 'finished';
                  this.tools.audioCutting.progress = 100;
                  this.tools.audioCutting.progressbarType = 'success';

                  if (this.tools.audioCutting.result.url !== undefined) {
                    window.URL.revokeObjectURL(
                      this.tools.audioCutting.result.url.toString(),
                    );
                  }

                  try {
                    this.tools.audioCutting.result.url =
                      this.sanitizer.bypassSecurityTrustResourceUrl(
                        URL.createObjectURL(
                          new File(
                            [data],
                            this.audio.audioManager.resource.info.name + '.zip',
                          ),
                        ),
                      );
                    this.tools.audioCutting.result.filename =
                      this.audio.audioManager.resource.info.name + '.zip';
                  } catch (e) {
                    this.modalsService.openModal(
                      ErrorModalComponent,
                      ErrorModalComponent.options,
                      {
                        text: (e as any).message ?? e,
                      },
                    );
                  }
                } else {
                  console.error(`cutting error`);
                  console.error(error);
                }
              },
            );

            /*
            this.tools.audioCutting.clientStreamHelper.accumulate().then((data) => {
              this.tools.audioCutting.status = 'finished';
              this.tools.audioCutting.progress = 100;
              this.tools.audioCutting.progressbarType = 'success';

              if (this.tools.audioCutting.result.url !== undefined) {
                window.URL.revokeObjectURL(this.tools.audioCutting.result.url);
              }

              this.tools.audioCutting.result.url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(data));
              this.tools.audioCutting.result.filename = this.audio.audioManager.ressource.info.name + '.zip';
              // finished
            });

            this.tools.audioCutting.clientStreamHelper.resume();

             */
          }
        },
        error: (err: any) => {
          if (this.tools.audioCutting.subscriptionIDs[2] > -1) {
            this.subscriptionManager.removeById(
              this.tools.audioCutting.subscriptionIDs[2],
            );
            this.tools.audioCutting.subscriptionIDs[2] = -1;
          }
          this.tools.audioCutting.cuttingSpeed = -1;
          this.tools.audioCutting.zippingSpeed = -1;

          console.error(`other error`);
          console.error(err);
        },
      },
    );

    this.tools.audioCutting.status = 'running';
    this.tools.audioCutting.progressbarType = 'info';

    this.getDurationFactorForZipping()
      .then((zipFactor) => {
        this.tools.audioCutting.zippingSpeed = zipFactor;

        cuttingStarted = Date.now();
        this.tools.audioCutting.cutter.cutChannelDataSequentially(
          this.namingConvention.namingConvention,
          this.audio.audioManager.channel,
          cutList,
        );
      })
      .catch((err) => {
        console.error(err);
      });
  }

  public stopAudioSplitting() {
    for (let i = 0; i < this.tools.audioCutting.subscriptionIDs.length; i++) {
      const subscriptionID = this.tools.audioCutting.subscriptionIDs[i];

      if (subscriptionID > -1) {
        this.subscriptionManager.removeById(subscriptionID);
      }
      this.tools.audioCutting.subscriptionIDs[i] = -1;
    }

    /*
    if (this.tools.audioCutting.clientStreamHelper !== undefined) {
      this.tools.audioCutting.clientStreamHelper.pause();
    }
     */

    this.tools.audioCutting.status = 'idle';

    this.tools.audioCutting.cuttingSpeed = -1;
    this.tools.audioCutting.zippingSpeed = -1;

    if (this.tools.audioCutting.cutter !== undefined) {
      this.tools.audioCutting.cutter.stopAudioSplitting();
    }
  }

  onCombinePhrasesClick() {
    if (!this.isSomethingBlocked()) {
      this.combinePhrases();
    }
  }

  isSomethingBlocked(): boolean {
    return (
      this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel &&
      this.annotationStoreService.currentLevel!.items.find((a) => {
        return a.context?.asr?.isBlockedBy !== undefined;
      }) !== undefined
    );
  }

  private getDurationFactorForZipping(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const started = Date.now();
      zipSync(
        {
          'test.txt': new Uint8Array(new ArrayBuffer(1024 * 1024)),
        },
        { level: 9 },
      );
      const dur = (Date.now() - started) / 1000;
      resolve(dur / (1024 * 1024));
    });
  }

  private combinePhrases() {
    this.annotationStoreService.combinePhrases(
      this.tools.combinePhrases.options,
    );
    this.close();
  }

  isToolEnabled(tool: string) {
    return (
      this.settings.projectsettings?.octra?.tools?.find((a) => a === tool) !==
      undefined
    );
  }

  ngOnInit() {
    this.annotationStoreService.transcript.levels.forEach((a) => {
      this.tools.regReplace.levels[a.name] = true;
    });
  }

  preview() {
    this.tools.regReplace.results = [];
    const regex = new RegExp(this.tools.regReplace.pattern, 'g');
    const selectedLevels = Object.keys(this.tools.regReplace.levels).filter(
      (a) => this.tools.regReplace.levels[a] === true,
    );

    if (selectedLevels.length > 0 && this.tools.regReplace.pattern !== '') {
      for (const level of this.annotationStoreService.transcript.levels) {
        this.tools.regReplace.results.push({
          name: level.name,
          matches: [],
        });
        const result = last(this.tools.regReplace.results);

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
                text: matches[0].replace(
                  new RegExp(regex, 'g'),
                  this.tools.regReplace.replacement,
                ),
              });
              matches = regex.exec(transcript);
            }
          }

          if (replacements.length > 0) {
            for (let i = replacements.length - 1; i > -1; i--) {
              const replacement = replacements[i];
              const start = `<div class="reg-replace-marker">`;
              const end = `</div>`;
              html = insertString(
                html,
                replacement.start + replacement.length,
                end,
              );
              html =
                html.slice(0, replacement.start) +
                (replacement.text || '&nbsp;') +
                html.slice(replacement.start + replacement.length);
              html = insertString(html, replacement.start, start);
            }

            result.matches.push({
              unitID: item.id,
              replacements,
              html,
            });
          }
        }

        if (result.matches.length === 0) {
          this.tools.regReplace.results.splice(
            this.tools.regReplace.results.length - 1,
            1,
          );
        }
      }
    }
  }
}
