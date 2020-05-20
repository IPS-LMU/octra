import {HttpClient} from '@angular/common/http';
import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {TranslocoService} from '@ngneat/transloco';
import {fadeInExpandOnEnterAnimation, fadeOutCollapseOnLeaveAnimation} from 'angular-animations';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Segment, WavFormat} from 'octra-components';
import {interval, Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {NamingDragAndDropComponent} from '../../component/naming-drag-and-drop/naming-drag-and-drop.component';
import {NavbarService} from '../../gui/navbar/navbar.service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {JSONConverter, TextTableConverter} from '../../obj/tools/audio-cutting/cutting-format';
import {isUnset} from '../../shared/Functions';
import {AppStorageService, AudioService, SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';

declare var JSZip;

@Component({
  selector: 'app-tools-modal',
  templateUrl: './tools-modal.component.html',
  styleUrls: ['./tools-modal.component.css'],
  animations: [
    fadeOutCollapseOnLeaveAnimation(),
    fadeInExpandOnEnterAnimation()
  ]
})
export class ToolsModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  public visible = false;

  public parentformat: {
    download: string,
    uri: SafeUrl
  } = {
    download: '',
    uri: ''
  };
  public converters = AppInfo.converters;
  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  public tools = {
    audioCutting: {
      opened: false,
      selectedMethod: 'client',
      progress: 0,
      result: {
        url: null,
        filename: ''
      },
      status: 'idle',
      message: '',
      progressbarType: 'info',
      showConfigurator: false,
      subscriptionIDs: [-1, -1, -1],
      exportFormats: [
        {
          label: 'TextTable',
          value: 'textTable',
          selected: true
        },
        {
          label: 'JSON',
          value: 'json',
          selected: true
        }
      ],
      clientStreamHelper: null,
      zippingSpeed: -1,
      cuttingSpeed: -1,
      cuttingTimeLeft: 0,
      timeLeft: 0,
      wavFormat: null
    },
    combinePhrases: {
      opened: false,
      status: 'idle',
      message: '',
      showOptions: false,
      options: {
        minSilenceLength: 100,
        maxWordsPerSegment: 10
      }
    }
  };

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('namingConvention', {static: false}) namingConvention: NamingDragAndDropComponent;
  @ViewChild('content', {static: false}) contentElement: ElementRef;

  @Input() transcrService: TranscriptionService;
  @Input() uiService: UserInteractionsService;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  get isCombinePhrasesSettingsValid(): boolean {
    return (Number.isInteger(this.tools.combinePhrases.options.minSilenceLength) &&
      Number.isInteger(this.tools.combinePhrases.options.maxWordsPerSegment) &&
      this.tools.combinePhrases.options.minSilenceLength >= 20
      && this.tools.combinePhrases.options.maxWordsPerSegment >= 0);
  }

  constructor(private sanitizer: DomSanitizer,
              public navbarServ: NavbarService,
              private modalService: BsModalService,
              private httpClient: HttpClient,
              private appStorage: AppStorageService,
              private audio: AudioService,
              private settService: SettingsService,
              public transloco: TranslocoService
  ) {
  }

  ngOnInit() {
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);

      this.visible = true;

      const subscr = this.actionperformed.subscribe(
        (action) => {
          resolve(action);
          subscr.unsubscribe();
        },
        (err) => {
          reject(err);
        }
      );

    });
  }

  public close() {
    this.modal.hide();

    this.actionperformed.next();
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    this.tools.audioCutting.status = 'idle';
    this.tools.audioCutting.progressbarType = 'idle';
    this.tools.audioCutting.progressbarType = 'idle';
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.result.filename = '';
    this.tools.audioCutting.result.url = null;
    this.tools.audioCutting.opened = false;
    this.tools.audioCutting.subscriptionIDs = [-1, -1];
    this.visible = false;
    this.subscrmanager.destroy();

    if (!isUnset(this.tools.audioCutting.result.url)) {
      window.URL.revokeObjectURL(this.tools.audioCutting.result.url);
    }

    if (!isUnset(this.parentformat.uri)) {
      const url = this.parentformat.uri['changingThisBreaksApplicationSecurity'];
      window.URL.revokeObjectURL(url);
    }
  }

  public splitAudioAPI() {
    const cutList = [];
    let startSample = 0;
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.progressbarType = 'info';
    this.tools.audioCutting.result.url = null;

    for (let i = 0; i < this.transcrService.currentlevel.segments.length; i++) {
      const segment: Segment = this.transcrService.currentlevel.segments.get(i);
      cutList.push({
        sampleStart: startSample,
        sampleDur: segment.time.samples - startSample
      });
      startSample = segment.time.samples;
    }

    const exportFormats = [];

    if (this.tools.audioCutting.exportFormats[0].selected) {
      exportFormats.push('json');
    }
    if (this.tools.audioCutting.exportFormats[1].selected) {
      exportFormats.push('textTable');
    }

    const formData: FormData = new FormData();
    const file = new File([this.audio.audiomanagers[0].ressource.arraybuffer], this.audio.audiomanagers[0].ressource.info.fullname,
      {type: this.audio.audiomanagers[0].ressource.info.type});
    formData.append('files', file, this.transcrService.audiofile.name);
    formData.append('segments', JSON.stringify(cutList));
    formData.append('cuttingOptions', JSON.stringify({
      exportFormats,
      namingConvention: this.namingConvention.namingConvention
    }));

    this.tools.audioCutting.status = 'started';
    this.tools.audioCutting.subscriptionIDs[0] = this.subscrmanager.add(
      this.httpClient.post(`${this.settService.appSettings.octra.plugins.audioCutter.url}/v1/cutAudio`, formData, {
        headers: {
          authorization: '7234rhuiweafauosijfaw89e77z23t'
        }, responseType: 'json'
      }).subscribe((result: any) => {
        const hash = result.hash;
        this.tools.audioCutting.subscriptionIDs[1] = this.subscrmanager.add(interval(500).subscribe(
          () => {
            this.httpClient.get(`${this.settService.appSettings.octra.plugins.audioCutter.url}/v1/tasks/${hash}`, {
              headers: {
                authorization: this.settService.appSettings.octra.plugins.audioCutter.authToken
              }, responseType: 'json'
            }).subscribe((result2: any) => {
              this.tools.audioCutting.progress = ((!isUnset(result2.progress)) ? Math.round(result2.progress * 100) : 0);
              this.tools.audioCutting.status = result2.status;

              if (result2.status === 'finished') {
                const url: string = result2.resultURL;
                this.tools.audioCutting.result.url = url;
                this.tools.audioCutting.result.filename = url.substring(url.lastIndexOf('/') + 1);
                this.subscrmanager.removeById(this.tools.audioCutting.subscriptionIDs[1]);
                this.tools.audioCutting.subscriptionIDs[1] = -1;
              } else if (result2.status === 'failed') {
                this.subscrmanager.removeById(this.tools.audioCutting.subscriptionIDs[1]);
                this.tools.audioCutting.subscriptionIDs[1] = -1;
              }

              switch (result2.status) {
                case ('finished'):
                  this.tools.audioCutting.progressbarType = 'success';
                  break;
                case ('pending'):
                  this.tools.audioCutting.progressbarType = 'info';
                  break;
                case ('failed'):
                  this.tools.audioCutting.progressbarType = 'danger';
                  this.tools.audioCutting.progress = 100;
                  this.tools.audioCutting.status = 'failed';
                  this.tools.audioCutting.message = (!isUnset(result2.message) && result2.message !== '') ? result2.message : '';
                  break;
              }
            }, (e) => {
              console.error(e);
              this.subscrmanager.removeById(this.tools.audioCutting.subscriptionIDs[1]);
              this.tools.audioCutting.subscriptionIDs[1] = -1;
            });
          }
        ));
      }, (err) => {
        this.tools.audioCutting.progressbarType = 'danger';
        this.tools.audioCutting.progress = 100;
        this.tools.audioCutting.status = 'failed';
        this.tools.audioCutting.message = 'API not available. Please send a message via the feedback form.';
        console.error(err);
      }));
  }

  public splitAudio() {
    if (this.tools.audioCutting.selectedMethod === 'client') {
      this.splitAudioClient();
    } else {
      this.splitAudioAPI();
    }
  }

  public splitAudioClient() {
    const cutList = [];
    let startSample = 0;
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.progressbarType = 'info';
    this.tools.audioCutting.result.url = null;

    for (let i = 0; i < this.transcrService.currentlevel.segments.length; i++) {
      const segment: Segment = this.transcrService.currentlevel.segments.get(i);
      let sampleDur = segment.time.samples - startSample;

      if (startSample + sampleDur > this.audio.audiomanagers[0].ressource.info.duration.samples) {
        console.error(`invalid sampleDur!!`);
        sampleDur = this.audio.audiomanagers[0].ressource.info.duration.samples - startSample;
      }

      cutList.push({
        number: i,
        sampleStart: startSample,
        sampleDur,
        transcript: segment.transcript
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
      this.transcrService.audioManager.ressource.info.fullname, this.transcrService.audioManager.ressource.arraybuffer
    );

    let zip = new JSZip();

    let totalSize = 0;
    let cuttingStarted = 0;

    this.tools.audioCutting.subscriptionIDs[1] = this.subscrmanager.add(this.tools.audioCutting.wavFormat.onaudiocut.subscribe(
      (status: {
        finishedSegments: number,
        file: File
      }) => {
        this.tools.audioCutting.progress = Math.round(status.finishedSegments / overallTasks * 100);
        zip = zip.file(status.file.name, status.file);
        totalSize += status.file.size;

        if (this.tools.audioCutting.cuttingSpeed < 0) {
          const now = Date.now();
          this.tools.audioCutting.cuttingSpeed = (now - cuttingStarted) / 1000 / status.file.size;

          const rest = (this.transcrService.audioManager.ressource.arraybuffer.byteLength - totalSize);
          this.tools.audioCutting.cuttingTimeLeft = this.tools.audioCutting.cuttingSpeed * rest;

          const zippingSpeed = this.tools.audioCutting.zippingSpeed;
          this.tools.audioCutting.timeLeft = Math.ceil((this.tools.audioCutting.cuttingTimeLeft
            + (this.transcrService.audioManager.ressource.arraybuffer.byteLength * zippingSpeed)) * 1000);

          this.tools.audioCutting.subscriptionIDs[2] = this.subscrmanager.add(interval(1000).subscribe(
            () => {
              this.tools.audioCutting.timeLeft -= 1000;
            }
          ));
        }

        if (status.finishedSegments === cutList.length) {
          // all segments cutted
          let finished = cutList.length;
          let lastCheck = -1;

          if (this.tools.audioCutting.exportFormats[0].selected) {
            // add TextTable
            const converter = new TextTableConverter();
            const content = converter.exportList(
              cutList, this.transcrService.audioManager.ressource.info,
              this.transcrService.audioManager.ressource.info.fullname,
              this.namingConvention.namingConvention
            );

            zip = zip.file(
              this.transcrService.audioManager.ressource.info.name + '_meta.txt',
              new File([content], this.transcrService.audioManager.ressource.info.name + '_meta.txt', {type: 'text/plain'})
            );
            finished++;
          }

          if (this.tools.audioCutting.exportFormats[1].selected) {
            // add JSON
            const converter = new JSONConverter();
            const content = converter.exportList(
              cutList, this.transcrService.audioManager.ressource.info,
              this.transcrService.audioManager.ressource.info.fullname,
              this.namingConvention.namingConvention
            );

            zip = zip.file(
              this.transcrService.audioManager.ressource.info.name + '_meta.json',
              new File([JSON.stringify(content, null, 2)],
                this.transcrService.audioManager.ressource.info.name + '_meta.json', {type: 'text/plain'})
            );
            finished++;
          }

          let sizeProcessed = 0;
          const startZipping = Date.now();
          this.tools.audioCutting.clientStreamHelper = zip.generateInternalStream({type: 'blob', streamFiles: true})
            .on('data', (data, metadata) => {
              if (sizeProcessed === 0) {
                // first process
                if (this.tools.audioCutting.subscriptionIDs[2] > -1) {
                  this.subscrmanager.removeById(this.tools.audioCutting.subscriptionIDs[2]);
                  this.tools.audioCutting.subscriptionIDs[2] = -1;
                }
                this.tools.audioCutting.cuttingSpeed = -1;
                this.tools.audioCutting.zippingSpeed = -1;
              }
              sizeProcessed += data.length;
              const overAllProgress = sizeProcessed / totalSize;
              // data is a Uint8Array because that's the type asked in generateInternalStream
              // metadata contains for example currentFile and percent, see the generateInternalStream doc.
              this.tools.audioCutting.progress = Number((((finished + overAllProgress) / overallTasks) * 100).toFixed(2));
              if (Date.now() - lastCheck >= 1000) {

                if (sizeProcessed > 1024 * 1024 * 2) {
                  this.tools.audioCutting.timeLeft = ((Date.now() - startZipping) / sizeProcessed) * (totalSize - sizeProcessed);
                }

                lastCheck = Date.now();
              }
            })
            .on('error', (e) => {
              // e is the error
              console.error(`cutting error`);
              console.error(e);
            })
            .on('end', () => {
              // no parameter
            });

          this.tools.audioCutting.clientStreamHelper.accumulate().then((data) => {
            this.tools.audioCutting.status = 'finished';
            this.tools.audioCutting.progress = 100;
            this.tools.audioCutting.progressbarType = 'success';

            if (!isUnset(this.tools.audioCutting.result.url)) {
              window.URL.revokeObjectURL(this.tools.audioCutting.result.url);
            }

            this.tools.audioCutting.result.url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(data));
            this.tools.audioCutting.result.filename = this.transcrService.audioManager.ressource.info.name + '.zip';
            // finished
          });

          this.tools.audioCutting.clientStreamHelper.resume();
        }
      },
      (err) => {
        if (this.tools.audioCutting.subscriptionIDs[2] > -1) {
          this.subscrmanager.removeById(this.tools.audioCutting.subscriptionIDs[2]);
          this.tools.audioCutting.subscriptionIDs[2] = -1;
        }
        this.tools.audioCutting.cuttingSpeed = -1;
        this.tools.audioCutting.zippingSpeed = -1;

        console.error(`other error`);
        console.error(err);
      }
    ));

    this.tools.audioCutting.status = 'running';
    this.tools.audioCutting.progressbarType = 'info';

    this.getDurationFactorForZipping().then((zipFactor) => {
      this.tools.audioCutting.zippingSpeed = zipFactor;

      cuttingStarted = Date.now();
      this.tools.audioCutting.wavFormat.startAudioCutting(
        this.transcrService.audioManager.ressource.info.type, this.namingConvention.namingConvention,
        this.transcrService.audioManager.ressource.arraybuffer, cutList);
    }).catch((err) => {
      console.error(err);
    });
  }

  public stopAudioSplitting() {
    for (let i = 0; i < this.tools.audioCutting.subscriptionIDs.length; i++) {
      const subscriptionID = this.tools.audioCutting.subscriptionIDs[i];

      if (subscriptionID > -1) {
        this.subscrmanager.removeById(subscriptionID);
      }
      this.tools.audioCutting.subscriptionIDs[i] = -1;
    }

    if (this.tools.audioCutting.clientStreamHelper !== null) {
      this.tools.audioCutting.clientStreamHelper.pause();
    }

    this.tools.audioCutting.status = 'idle';

    this.tools.audioCutting.cuttingSpeed = -1;
    this.tools.audioCutting.zippingSpeed = -1;

    if (!isUnset(this.tools.audioCutting.wavFormat)) {
      (this.tools.audioCutting.wavFormat as WavFormat).stopAudioSplitting();
    }
  }

  onCombinePhrasesClick() {
    if (!this.isSomethingBlocked()) {
      this.combinePhrases();
    }
  }

  isSomethingBlocked(): boolean {
    return this.transcrService.currentlevel.segments.segments.find((a) => {
      return !isUnset(a.isBlockedBy);
    }) !== undefined;
  }

  private getDurationFactorForZipping(): Promise<number> {
    return new Promise<number>((resolve, reject) => {

      let zip = new JSZip();

      const file = new File([new ArrayBuffer(1024 * 1024)], 'test.txt');

      zip = zip.file('test.txt', file);

      const started = Date.now();
      zip.generateAsync({type: 'blob'}).then(() => {
        const dur = (Date.now() - started) / 1000;
        resolve(dur / file.size);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  private combinePhrases() {
    const maxWords = this.tools.combinePhrases.options.maxWordsPerSegment;
    const minSilenceLength = this.tools.combinePhrases.options.minSilenceLength;
    const isSilence = (segment: Segment) => {
      return ((segment.transcript.trim() === '' ||
        segment.transcript.trim() === this.transcrService.breakMarker.code ||
        segment.transcript.trim() === '<p:>'));
    };

    const countWords = (text: string) => {
      return text.trim().split(' ').length;
    };

    let wordCounter = 0;

    for (let i = 0; i < this.transcrService.currentlevel.segments.segments.length; i++) {
      const segment = this.transcrService.currentlevel.segments.segments[i];

      let startPos = 0;
      if (i > 0) {
        startPos = this.transcrService.currentlevel.segments.segments[i - 1].time.seconds;
      }
      let duration = Math.round((segment.time.seconds - startPos) * 1000);
      if (!isSilence(segment) || duration < minSilenceLength) {
        if (maxWords > 0 && wordCounter >= maxWords) {
          wordCounter = (isSilence(segment)) ? 0 : countWords(segment.transcript);
        } else {
          if (i > 0) {
            const lastSegment = this.transcrService.currentlevel.segments.segments[i - 1];
            startPos = 0;
            if (i > 1) {
              startPos = this.transcrService.currentlevel.segments.segments[i - 2].time.seconds;
            }
            duration = Math.round((lastSegment.time.seconds - startPos) * 1000);
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
              this.transcrService.currentlevel.segments.segments.splice(i - 1, 1);
              this.transcrService.saveSegments();
              i--;
            }
          }
        }
      }
    }

    this.close();
    setTimeout(() => {
      this.navbarServ.toolApplied.emit('combinePhrases');
    }, 1000);
  }
}
