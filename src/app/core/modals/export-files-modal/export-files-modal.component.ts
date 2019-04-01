import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {AppStorageService, AudioService, SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AppInfo} from '../../../app.info';
import {Converter, IFile} from '../../obj/Converters';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {OCTRANIMATIONS, Segment} from '../../shared';
import {NavbarService} from '../../gui/navbar/navbar.service';
import {isNullOrUndefined} from '../../shared/Functions';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {NamingDragAndDropComponent} from '../../component/naming-drag-and-drop/naming-drag-and-drop.component';
import {WavFormat} from '../../../media-components/obj/media/audio/AudioFormats';
import {error} from '@angular/compiler/src/util';
import {JSONConverter, TextTableConverter} from '../../obj/tools/audio-cutting/cutting-format';

declare var JSZip;

@Component({
  selector: 'app-export-files-modal',
  templateUrl: './export-files-modal.component.html',
  styleUrls: ['./export-files-modal.component.css'],
  animations: OCTRANIMATIONS
})
export class ExportFilesModalComponent implements OnInit, OnDestroy {
  modalRef: BsModalRef;
  AppInfo = AppInfo;
  public visible = false;
  public export_states = [];
  public preparing = {
    name: '',
    preparing: false
  };
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
      subscriptionIDs: [-1, -1],
      exportFormats: [
        {
          label: 'TextTable',
          value: 'textTable',
          selected: false
        },
        {
          label: 'JSON',
          value: 'json',
          selected: false
        }
      ],
      clientStreamHelper: null,
      timeLeft: 0
    }
  };

  @ViewChild('modal') modal: any;
  @ViewChild('namingConvention') namingConvention: NamingDragAndDropComponent;

  @Input() transcrService: TranscriptionService;
  @Input() uiService: UserInteractionsService;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  public get arraybufferExists(): boolean {
    return (!(this.navbarServ.transcrService === null || this.navbarServ.transcrService === undefined)
      && !(this.navbarServ.transcrService.audiomanager.ressource.arraybuffer === null
        || this.navbarServ.transcrService.audiomanager.ressource.arraybuffer === undefined)
      && this.navbarServ.transcrService.audiomanager.ressource.arraybuffer.byteLength > 0);
  }

  constructor(private sanitizer: DomSanitizer,
              public navbarServ: NavbarService,
              private modalService: BsModalService,
              private httpClient: HttpClient,
              private appStorage: AppStorageService,
              private audio: AudioService,
              private settService: SettingsService) {
  }

  ngOnInit() {
    for (let i = 0; i < AppInfo.converters.length; i++) {
      this.export_states.push('inactive');
    }
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


  onLineClick(converter: Converter, index: number) {
    if (converter.multitiers || (!converter.multitiers && this.transcrService.annotation.levels.length === 1)) {
      this.updateParentFormat(converter);
    }
    this.toggleLine(index);
  }

  sanitize(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  toggleLine(index: number) {
    for (let i = 0; i < this.export_states.length; i++) {
      if (this.export_states[i] === 'active') {
        this.export_states[i] = 'close';
      }
    }

    if (index < this.export_states.length) {
      if (this.export_states[index] === 'active') {
        this.export_states[index] = 'inactive';
      } else {
        this.export_states[index] = 'active';
      }
    }
  }

  getAudioURI() {
    if (!(this.transcrService === null || this.transcrService === undefined)
      && !(this.transcrService.audiomanager.ressource.arraybuffer === null
        || this.transcrService.audiomanager.ressource.arraybuffer === undefined)) {
      this.preparing = {
        name: 'Audio',
        preparing: true
      };
      this.parentformat.download = this.transcrService.audiomanager.ressource.name + this.transcrService.audiomanager.ressource.extension;

      window.URL = (((<any>window).URL) ||
        ((<any>window).webkitURL) || false);

      if (this.parentformat.uri !== null) {
        window.URL.revokeObjectURL(this.parentformat.uri.toString());
      }
      const test = new File([this.transcrService.audiomanager.ressource.arraybuffer], this.parentformat.download);
      const urlobj = window.URL.createObjectURL(test);
      this.parentformat.uri = this.sanitize(urlobj);
      this.preparing = {
        name: 'Audio',
        preparing: false
      };
    } else {
      console.error('can\'t get audio file');
    }
  }


  onSelectionChange(converter: Converter, value: any) {
    if (value !== '') {
      this.updateParentFormat(converter, value);
    }
  }

  updateParentFormat(converter: Converter, levelnum?: number) {
    if (isNullOrUndefined(levelnum) && !converter.multitiers) {
      levelnum = 0;
    }

    if (!this.preparing.preparing) {
      const oannotjson = this.navbarServ.transcrService.annotation.getObj(this.transcrService.audiomanager.originalInfo.duration);
      this.preparing = {
        name: converter.name,
        preparing: true
      };
      setTimeout(() => {
        if (converter.name === 'Bundle') {
          // only this converter needs an array buffer
          this.navbarServ.transcrService.audiofile.arraybuffer = this.transcrService.audiomanager.ressource.arraybuffer;
        }

        const result: IFile = converter.export(oannotjson, this.navbarServ.transcrService.audiofile, levelnum).file;

        this.parentformat.download = result.name;

        window.URL = (((<any>window).URL) ||
          ((<any>window).webkitURL) || false);

        if (this.parentformat.uri !== null) {
          window.URL.revokeObjectURL(this.parentformat.uri.toString());
        }
        const test = new File([result.content], result.name);
        const urlobj = window.URL.createObjectURL(test);
        this.parentformat.uri = this.sanitize(urlobj);
        this.preparing = {
          name: converter.name,
          preparing: false
        };
      }, 300);
    }
  }

  getProtocol() {
    if (!(this.transcrService === null || this.transcrService === undefined)) {
      this.preparing = {
        name: 'Protocol',
        preparing: true
      };
      this.parentformat.download = this.transcrService.audiofile.name + '.json';

      window.URL = (((<any>window).URL) ||
        ((<any>window).webkitURL) || false);

      if (this.parentformat.uri !== null) {
        window.URL.revokeObjectURL(this.parentformat.uri.toString());
      }
      const json = new File([JSON.stringify(this.transcrService.extractUI(this.uiService.elements), null, 2)], this.parentformat.download);
      const urlobj = window.URL.createObjectURL(json);
      this.parentformat.uri = this.sanitize(urlobj);
      this.preparing = {
        name: 'Protocol',
        preparing: false
      };
    } else {
      console.error('can\'t get protocol file');
    }
  }

  onDownloadClick(i: number) {
    setTimeout(() => {
      this.export_states[i] = 'inactive';
    }, 500);
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    for (let i = 0; i < this.export_states.length; i++) {
      this.export_states[i] = 'inactive';
    }

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
        sampleDur: segment.time.originalSample.value - startSample
      });
      startSample = segment.time.originalSample.value;
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
      exportFormats: exportFormats,
      namingConvention: this.namingConvention.namingConvention
    }));

    this.tools.audioCutting.status = 'started';
    this.tools.audioCutting.subscriptionIDs[0] = this.subscrmanager.add(
      this.httpClient.post(`${this.settService.app_settings.octra.plugins.audioCutter.url}/v1/cutAudio`, formData, {
        headers: {
          'authorization': '7234rhuiweafauosijfaw89e77z23t'
        }, responseType: 'json'
      }).subscribe((result: any) => {
        const hash = result.hash;
        this.tools.audioCutting.subscriptionIDs[1] = this.subscrmanager.add(Observable.interval(500).subscribe(
          () => {
            this.httpClient.get(`${this.settService.app_settings.octra.plugins.audioCutter.url}/v1/tasks/${hash}`, {
              headers: {
                'authorization': this.settService.app_settings.octra.plugins.audioCutter.authToken
              }, responseType: 'json'
            }).subscribe((result2: any) => {
              this.tools.audioCutting.progress = ((!isNullOrUndefined(result2.progress)) ? Math.round(result2.progress * 100) : 0);
              this.tools.audioCutting.status = result2.status;

              if (result2.status === 'finished') {
                const url: string = result2['resultURL'];
                this.tools.audioCutting.result.url = url;
                this.tools.audioCutting.result.filename = url.substring(url.lastIndexOf('/') + 1);
                this.subscrmanager.remove(this.tools.audioCutting.subscriptionIDs[1]);
                this.tools.audioCutting.subscriptionIDs[1] = -1;
              } else if (result2.status === 'failed') {
                this.subscrmanager.remove(this.tools.audioCutting.subscriptionIDs[1]);
                this.tools.audioCutting.subscriptionIDs[1] = -1;
              }

              switch (result2.status) {
                case ('finished'):
                  console.log(`set success!`);
                  this.tools.audioCutting.progressbarType = 'success';
                  break;
                case ('pending'):
                  this.tools.audioCutting.progressbarType = 'info';
                  break;
                case ('failed'):
                  this.tools.audioCutting.progressbarType = 'danger';
                  this.tools.audioCutting.progress = 100;
                  this.tools.audioCutting.status = 'failed';
                  this.tools.audioCutting.message = (!isNullOrUndefined(result2.message) && result2.message !== '') ? result2.message : '';
                  break;
              }
            }, (e) => {
              console.log(e);
              this.subscrmanager.remove(this.tools.audioCutting.subscriptionIDs[1]);
              this.tools.audioCutting.subscriptionIDs[1] = -1;
            });
          }
        ));
      }, (err) => {
        this.tools.audioCutting.progressbarType = 'danger';
        this.tools.audioCutting.progress = 100;
        this.tools.audioCutting.status = 'failed';
        this.tools.audioCutting.message = 'API not available. Please send a message via the feedback form.';
        console.error(error);
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
      cutList.push({
        number: i,
        sampleStart: startSample,
        sampleDur: segment.time.originalSample.value - startSample
      });
      startSample = segment.time.originalSample.value;
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
    const wavFormat = new WavFormat();
    console.log(this.transcrService.audiomanager.ressource.arraybuffer.byteLength);
    wavFormat.init(this.transcrService.audiomanager.ressource.info.fullname, this.transcrService.audiomanager.ressource.arraybuffer);

    let zip = new JSZip();

    /*
    const taskManager = new TaskManager([
      {
        name: 'cutAudioFile',
        do: (args: any[]) => {
          const filename = args[0];
          const buffer: ArrayBuffer = args[1];
          const channels: number = args[2];
          const blockAlign: number = args[3];
          const segments: {
            number: number,
            sampleStart: number,
            sampleDur: number
          }[] = args[4];
          const bitsPerSample: number = args[5];
          const sampleRate: number = args[6];

          const results = [];

          const calculateData = function (start: number, duration: number, u8array: Uint8Array): number[] {
            const result: number[] = [];
            let counter = 0;

            for (let i = 44 + start; i < 44 + start + duration; i++) {
              try {
                for (let j = 0; j < channels; j++) {
                  for (let k = 0; k < blockAlign / channels; k++) {
                    result.push(u8array[i + k]);
                  }
                  if (channels === 2) {
                    i += blockAlign / channels;
                  } else {
                    i += blockAlign;
                  }
                }

                i--;
                counter++;
              } catch (e) {
                console.error(e);
                break;
              }
            }
            return result;
          };

          const writeString = function (view, offset, string) {
            for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
            }
          };

          const getFileFromBufferPart = function (data: number[], filename2: string): File {
            const samples = (data.length * 2 * 8) / (bitsPerSample);

            const buffer2 = new ArrayBuffer(44 + data.length);
            const dataView = new DataView(buffer2);

            // RIFF identifier
            writeString(dataView, 0, 'RIFF');
            // RIFF chunk length
            dataView.setUint32(4, 36 + samples, true);
            // RIFF type
            writeString(dataView, 8, 'WAVE');
            // format chunk identifier
            writeString(dataView, 12, 'fmt ');
            // format chunk length
            dataView.setUint32(16, 16, true);
            // sample format (raw)
            dataView.setUint16(20, 1, true);
            // channel count
            dataView.setUint16(22, channels, true);
            // sample rate
            dataView.setUint32(24, sampleRate, true);
            // byte rate (sample rate * block align)
            dataView.setUint32(28, sampleRate * 2, true);
            // block align (channel count * bytes per sample)
            dataView.setUint16(32, 2, true);
            // bits per sample
            dataView.setUint16(34, bitsPerSample, true);
            // data chunk identifier
            writeString(dataView, 36, 'data');
            // data chunk length
            dataView.setUint32(40, data.length, true);

            for (let i = 0; i < data.length; i++) {
              dataView.setUint8(44 + i, data[i]);
            }
            return new File([dataView], filename2 + '.wav', {type: 'audio/wav'});
          };

          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];

            const start = segment.sampleStart * channels * 2;
            const duration = segment.sampleDur * channels * 2;
            const newFileName = filename + '_' + segment.number + '.wav';

            const u8array = new Uint8Array(buffer);
            // @ts-ignore

            const data = calculateData(start, duration, u8array);
            results.push(getFileFromBufferPart(data, newFileName));
            console.log(results);
          }

          return results;
        }
      }
    ]);
    console.log(`cut ${cutList.length} segments`);

    taskManager.run('cutAudioFile', [
      this.transcrService.audiomanager.ressource.info.fullname,
      this.transcrService.audiomanager.ressource.arraybuffer,
      this.transcrService.audiomanager.ressource.info.channels,
      wavFormat.blockAlign,
      cutList,
      wavFormat.bitsPerSample,
      wavFormat.sampleRate
    ]).then((results) => {
      console.log(`FINISHED!?`);
      console.log(results);
    }).catch((err) => {
      console.error(err);
    });*/

    let totalSize = 0;
    this.subscrmanager.add(wavFormat.onaudiocut.subscribe(
      (status: {
        finishedSegments: number,
        file: File
      }) => {
        this.tools.audioCutting.progress = Math.round(status.finishedSegments / overallTasks * 100);
        zip = zip.file(status.file.name, status.file);
        totalSize += status.file.size;

        if (status.finishedSegments === cutList.length) {
          // all segments cutted
          let finished = cutList.length;
          let percentsPerSecond = -1;
          let percents = 0;
          let lastCheck = -1;

          if (this.tools.audioCutting.exportFormats[0].selected) {
            // add TextTable
            const converter = new TextTableConverter();
            const content = converter.exportList(
              cutList, this.transcrService.audiomanager.ressource.info,
              this.transcrService.audiomanager.ressource.info.fullname,
              this.namingConvention.namingConvention
            );

            zip = zip.file(
              this.transcrService.audiomanager.ressource.info.name + '_meta.txt',
              new File([content], this.transcrService.audiomanager.ressource.info.name + '_meta.txt', {type: 'text/plain'})
            );
            finished++;
          }

          if (this.tools.audioCutting.exportFormats[1].selected) {
            // add JSON
            const converter = new JSONConverter();
            const content = converter.exportList(
              cutList, this.transcrService.audiomanager.ressource.info,
              this.transcrService.audiomanager.ressource.info.fullname,
              this.namingConvention.namingConvention
            );

            zip = zip.file(
              this.transcrService.audiomanager.ressource.info.name + '_meta.json',
              new File([JSON.stringify(content, null, 2)], this.transcrService.audiomanager.ressource.info.name + '_meta.json', {type: 'text/plain'})
            );
            finished++;
          }

          let sizeProcessed = 0;
          this.tools.audioCutting.clientStreamHelper = zip.generateInternalStream({type: 'blob', streamFiles: true})
            .on('data', (data, metadata) => {
              sizeProcessed += data.length;
              const overAllProgress = sizeProcessed / totalSize;
              // data is a Uint8Array because that's the type asked in generateInternalStream
              // metadata contains for example currentFile and percent, see the generateInternalStream doc.
              this.tools.audioCutting.progress = Number((((finished + overAllProgress) / overallTasks) * 100).toFixed(2));
              if (Date.now() - lastCheck >= 1000) {
                percentsPerSecond = overAllProgress - percents;

                if (percentsPerSecond > 0.00001) {
                  this.tools.audioCutting.timeLeft = Math.ceil((1 - overAllProgress) / percentsPerSecond * 1000);
                }

                lastCheck = Date.now();
                percents = overAllProgress;
              }
            })
            .on('error', (e) => {
              // e is the error
              console.error(e);
            })
            .on('end', () => {
              // no parameter
              console.log(`end`);
            });

          this.tools.audioCutting.clientStreamHelper.accumulate().then((data) => {
            this.tools.audioCutting.status = 'finished';
            this.tools.audioCutting.progress = 100;
            this.tools.audioCutting.progressbarType = 'success';
            this.tools.audioCutting.result.url = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(data));
            this.tools.audioCutting.result.filename = this.transcrService.audiomanager.ressource.info.name + '.zip';
            // finished
          });

          this.tools.audioCutting.clientStreamHelper.resume();
        }
      },
      (err) => {
        error(err);
      }
    ));

    this.tools.audioCutting.status = 'running';
    this.tools.audioCutting.progressbarType = 'info';
    wavFormat.cutAudioFileSequentially(this.transcrService.audiomanager.ressource.info.type, this.namingConvention.namingConvention,
      this.transcrService.audiomanager.ressource.arraybuffer, cutList);
  }

  public stopAudioSplitting() {
    for (let i = 0; i < this.tools.audioCutting.subscriptionIDs.length; i++) {
      const subscriptionID = this.tools.audioCutting.subscriptionIDs[i];

      if (subscriptionID > -1) {
        this.subscrmanager.remove(subscriptionID);
      }
      this.tools.audioCutting.subscriptionIDs[i] = -1;
    }

    if (this.tools.audioCutting.clientStreamHelper !== null) {
      this.tools.audioCutting.clientStreamHelper.pause();
      console.log(`client zipping paused`);
    }

    this.tools.audioCutting.status = 'idle';
  }
}
