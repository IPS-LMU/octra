import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';
import { TranslocoService } from '@ngneat/transloco';
import {
  fadeInExpandOnEnterAnimation,
  fadeOutCollapseOnLeaveAnimation,
} from 'angular-animations';
import { interval, timer } from 'rxjs';
import { AppInfo } from '../../../app.info';
import { NamingDragAndDropComponent } from '../../tools/naming-drag-and-drop/naming-drag-and-drop.component';
import { NavbarService } from '../../component/navbar/navbar.service';
import {
  JSONConverter,
  TextTableConverter,
} from '../../obj/tools/audio-cutting/cutting-format';
import { AudioService, UserInteractionsService } from '../../shared/service';
import {
  OctraAnnotationSegment,
  OctraAnnotationSegmentLevel,
} from '@octra/annotation';
import { IntArray, WavFormat } from '@octra/web-media';
import { OctraModal } from '../types';
import { strToU8, zip, zipSync } from 'fflate';
import { OctraModalService } from '../octra-modal.service';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-tools-modal',
  templateUrl: './tools-modal.component.html',
  styleUrls: ['./tools-modal.component.scss'],
  animations: [
    fadeOutCollapseOnLeaveAnimation(),
    fadeInExpandOnEnterAnimation(),
  ],
})
export class ToolsModalComponent extends OctraModal implements OnDestroy {
  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: false,
    scrollable: true,
    size: 'xl',
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
      wavFormat?: any;
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
      wavFormat: undefined,
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

  constructor(
    private sanitizer: DomSanitizer,
    public navbarServ: NavbarService,
    modalService: NgbModal,
    private modalsService: OctraModalService,
    private httpClient: HttpClient,
    public annotationStoreService: AnnotationStoreService,
    public audio: AudioService,
    public transloco: TranslocoService,
    protected override activeModal: NgbActiveModal
  ) {
    super('toolsModal', activeModal);
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
    this.subscrManager.destroy();

    if (this.tools.audioCutting.result.url !== undefined) {
      window.URL.revokeObjectURL(this.tools.audioCutting.result.url);
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
    // TODO arraybuffer is c
    this.tools.audioCutting.wavFormat = new WavFormat();
    this.tools.audioCutting.wavFormat.init(
      this.audio.audioManager.resource.info.fullname,
      this.audio.audioManager.resource.arraybuffer!
    );

    let totalSize = 0;
    let cuttingStarted = 0;

    this.tools.audioCutting.subscriptionIDs[1] = this.subscrManager.add(
      this.tools.audioCutting.wavFormat.onaudiocut.subscribe({
        next: (status: {
          finishedSegments: number;
          fileName: string;
          intArray: IntArray;
        }) => {
          this.tools.audioCutting.progress = Math.round(
            (status.finishedSegments / overallTasks) * 100
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
                1000
            );

            this.tools.audioCutting.subscriptionIDs[2] = this.subscrManager.add(
              interval(1000).subscribe(() => {
                this.tools.audioCutting.timeLeft -= 1000;
              })
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
                this.namingConvention.namingConvention
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
                this.namingConvention.namingConvention
              );

              this.tools.audioCutting.archiveStructure[
                this.audio.audioManager.resource.info.name + '_meta.json'
              ] = strToU8(JSON.stringify(content, undefined, 2));
              finished++;
            }

            let sizeProcessed = 0;
            const startZipping = Date.now();
            /** TODO better use stream **/
            zip(
              this.tools.audioCutting.archiveStructure,
              { level: 9 },
              (error, data) => {
                if (!error) {
                  if (sizeProcessed === 0) {
                    // first process
                    if (this.tools.audioCutting.subscriptionIDs[2] > -1) {
                      this.subscrManager.removeById(
                        this.tools.audioCutting.subscriptionIDs[2]
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
                    ).toFixed(2)
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
                      this.tools.audioCutting.result.url.toString()
                    );
                  }

                  try {
                    this.tools.audioCutting.result.url =
                      this.sanitizer.bypassSecurityTrustResourceUrl(
                        URL.createObjectURL(
                          new File(
                            [data],
                            this.audio.audioManager.resource.info.name + '.zip'
                          )
                        )
                      );
                    this.tools.audioCutting.result.filename =
                      this.audio.audioManager.resource.info.name + '.zip';
                  } catch (e) {
                    this.modalsService.openModal(
                      ErrorModalComponent,
                      ErrorModalComponent.options,
                      {
                        text: (e as any).message ?? e,
                      }
                    );
                  }
                } else {
                  console.error(`cutting error`);
                  console.error(error);
                }
              }
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
            this.subscrManager.removeById(
              this.tools.audioCutting.subscriptionIDs[2]
            );
            this.tools.audioCutting.subscriptionIDs[2] = -1;
          }
          this.tools.audioCutting.cuttingSpeed = -1;
          this.tools.audioCutting.zippingSpeed = -1;

          console.error(`other error`);
          console.error(err);
        },
      })
    );

    this.tools.audioCutting.status = 'running';
    this.tools.audioCutting.wavFormat.status = 'running';
    this.tools.audioCutting.progressbarType = 'info';

    this.getDurationFactorForZipping()
      .then((zipFactor) => {
        this.tools.audioCutting.zippingSpeed = zipFactor;

        cuttingStarted = Date.now();
        this.tools.audioCutting.wavFormat.cutAudioFileSequentially(
          this.namingConvention.namingConvention,
          this.audio.audioManager.resource.arraybuffer,
          cutList
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
        this.subscrManager.removeById(subscriptionID);
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

    if (this.tools.audioCutting.wavFormat !== undefined) {
      (this.tools.audioCutting.wavFormat as WavFormat).stopAudioSplitting();
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
        { level: 9 }
      );
      const dur = (Date.now() - started) / 1000;
      resolve(dur / (1024 * 1024));
    });
  }

  private combinePhrases() {
    if (
      !(
        this.annotationStoreService.currentLevel instanceof
        OctraAnnotationSegmentLevel
      )
    ) {
      return;
    }

    let transcript = this.annotationStoreService.transcript;
    const currentLevel: OctraAnnotationSegmentLevel<OctraAnnotationSegment> =
      transcript!.levels[
        this.annotationStoreService.currentLevelIndex
      ] as OctraAnnotationSegmentLevel<OctraAnnotationSegment>;

    const maxWords = this.tools.combinePhrases.options.maxWordsPerSegment;
    const minSilenceLength = this.tools.combinePhrases.options.minSilenceLength;
    const isSilence = (segment: OctraAnnotationSegment) => {
      return (
        segment.getFirstLabelWithoutName('Speaker')?.value.trim() === '' ||
        segment.getFirstLabelWithoutName('Speaker')?.value.trim() ===
          this.annotationStoreService.breakMarker?.code ||
        segment.getFirstLabelWithoutName('Speaker')?.value.trim() === '<p:>' ||
        segment.getFirstLabelWithoutName('Speaker')?.value.trim() ===
          this.annotationStoreService.breakMarker?.code
      );
    };

    const countWords = (text: string) => {
      return text.trim().split(' ').length;
    };

    let wordCounter = 0;

    for (let i = 0; i < currentLevel.items.length; i++) {
      const segment = currentLevel.items[i];

      let startPos = 0;
      if (i > 0) {
        startPos = currentLevel.items[i - 1].time.unix;
      }
      let duration = segment.time.unix - startPos;
      if (!isSilence(segment) || duration < minSilenceLength) {
        if (maxWords > 0 && wordCounter >= maxWords) {
          wordCounter = isSilence(segment)
            ? 0
            : countWords(
                segment.getFirstLabelWithoutName('Speaker')?.value ?? ''
              );
        } else {
          if (i > 0) {
            const lastSegment = currentLevel.items[i - 1];
            startPos = 0;
            if (i > 1) {
              startPos = currentLevel.items[i - 2].time.unix;
            }
            duration = lastSegment.time.unix - startPos;
            if (!isSilence(lastSegment) || duration < minSilenceLength) {
              let lastSegmentText =
                lastSegment.getFirstLabelWithoutName('Speaker')?.value;
              let segmentText =
                segment.getFirstLabelWithoutName('Speaker')?.value;

              if (isSilence(lastSegment)) {
                lastSegmentText = '';
              }

              if (!isSilence(segment)) {
                segment.changeFirstLabelWithoutName(
                  'Speaker',
                  `${lastSegmentText} ${segmentText}`
                );
                wordCounter = countWords(`${lastSegmentText} ${segmentText}`);
              } else {
                segmentText = '';
                segment.changeFirstLabelWithoutName(
                  'Speaker',
                  `${lastSegmentText}`
                );
              }
              transcript = transcript!.removeItemByIndex(i - 1, '', false);
              i--;
            }
          }
        }
      }
    }

    this.close();

    this.subscrManager.add(
      timer(1000).subscribe(() => {
        this.navbarServ.toolApplied.emit('combinePhrases');
      })
    );
  }
}
