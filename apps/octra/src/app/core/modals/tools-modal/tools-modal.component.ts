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
import {
  AudioService,
  TranscriptionService,
  UserInteractionsService,
} from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { Segment } from '@octra/annotation';
import { IntArray, WavFormat } from '@octra/media';
import { OctraModal } from '../types';
import { strToU8, zip, zipSync } from 'fflate';
import { OctraModalService } from '../octra-modal.service';
import { ErrorModalComponent } from '../error-modal/error-modal.component';
import {
  NgbActiveModal,
  NgbModal,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';

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

  @Input() transcrService!: TranscriptionService;
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
    private appStorage: AppStorageService,
    private audio: AudioService,
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

    if (!this.transcrService?.currentlevel) {
      return;
    }

    for (
      let i = 0;
      i < this.transcrService.currentlevel!.segments.length;
      i++
    ) {
      const segment: Segment =
        this.transcrService.currentlevel!.segments.get(i)!;
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
        transcript: segment.transcript,
      });
      startSample = segment.time.samples;
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
      this.transcrService.audioManager.resource.info.fullname,
      this.transcrService.audioManager.resource.arraybuffer!
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
              this.transcrService.audioManager.resource.arraybuffer!
                .byteLength - totalSize;
            this.tools.audioCutting.cuttingTimeLeft =
              this.tools.audioCutting.cuttingSpeed * rest;

            const zippingSpeed = this.tools.audioCutting.zippingSpeed;
            this.tools.audioCutting.timeLeft = Math.ceil(
              (this.tools.audioCutting.cuttingTimeLeft +
                this.transcrService.audioManager.resource.arraybuffer!
                  .byteLength *
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
                this.transcrService.audioManager.resource.info,
                this.transcrService.audioManager.resource.info.fullname,
                this.namingConvention.namingConvention
              );

              this.tools.audioCutting.archiveStructure[
                this.transcrService.audioManager.resource.info.name +
                  '_meta.txt'
              ] = strToU8(content);
              finished++;
            }

            if (this.tools.audioCutting.exportFormats[1].selected) {
              // add JSON
              const converter = new JSONConverter();
              const content = converter.exportList(
                cutList,
                this.transcrService.audioManager.resource.info,
                this.transcrService.audioManager.resource.info.fullname,
                this.namingConvention.namingConvention
              );

              this.tools.audioCutting.archiveStructure[
                this.transcrService.audioManager.resource.info.name +
                  '_meta.json'
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
                            this.transcrService.audioManager.resource.info
                              .name + '.zip'
                          )
                        )
                      );
                    this.tools.audioCutting.result.filename =
                      this.transcrService.audioManager.resource.info.name +
                      '.zip';
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
              this.tools.audioCutting.result.filename = this.transcrService.audioManager.ressource.info.name + '.zip';
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
          this.transcrService.audioManager.resource.arraybuffer,
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
      this.transcrService.currentlevel!.segments.segments.find((a) => {
        return a.isBlockedBy !== undefined;
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
    const maxWords = this.tools.combinePhrases.options.maxWordsPerSegment;
    const minSilenceLength = this.tools.combinePhrases.options.minSilenceLength;
    const isSilence = (segment: Segment) => {
      return (
        segment.transcript.trim() === '' ||
        segment.transcript.trim() === this.transcrService.breakMarker.code ||
        segment.transcript.trim() === '<p:>' ||
        segment.transcript.trim() === this.transcrService.breakMarker.code
      );
    };

    const countWords = (text: string) => {
      return text.trim().split(' ').length;
    };

    let wordCounter = 0;

    for (
      let i = 0;
      i < this.transcrService!.currentlevel!.segments.segments.length;
      i++
    ) {
      const segment = this.transcrService!.currentlevel!.segments.segments[i];

      let startPos = 0;
      if (i > 0) {
        startPos =
          this.transcrService!.currentlevel!.segments.segments[i - 1].time.unix;
      }
      let duration = segment.time.unix - startPos;
      if (!isSilence(segment) || duration < minSilenceLength) {
        if (maxWords > 0 && wordCounter >= maxWords) {
          wordCounter = isSilence(segment) ? 0 : countWords(segment.transcript);
        } else {
          if (i > 0) {
            const lastSegment =
              this.transcrService!.currentlevel!.segments.segments[i - 1];
            startPos = 0;
            if (i > 1) {
              startPos =
                this.transcrService.currentlevel!.segments.segments[i - 2].time
                  .unix;
            }
            duration = lastSegment.time.unix - startPos;
            if (!isSilence(lastSegment) || duration < minSilenceLength) {
              let lastSegmentText = lastSegment.transcript;
              let segmentText = segment.transcript;

              if (isSilence(lastSegment)) {
                lastSegmentText = '';
              }

              if (!isSilence(segment)) {
                segment.transcript = `${lastSegmentText} ${segment.transcript}`;
                wordCounter = countWords(segment.transcript);
              } else {
                segmentText = '';
                segment.transcript = `${lastSegmentText}`;
              }
              this.transcrService.currentlevel!.segments.removeByIndex(
                i - 1,
                '',
                false
              );
              i--;
            }
          }
        }
      }
    }

    this.close();
    this.transcrService.currentLevelSegmentChange.emit();

    this.subscrManager.add(
      timer(1000).subscribe(() => {
        this.navbarServ.toolApplied.emit('combinePhrases');
      })
    );
  }
}
