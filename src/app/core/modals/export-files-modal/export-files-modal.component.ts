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
      progress: 0,
      result: {
        url: '',
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
      ]
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
  }

  onHidden() {
    for (let i = 0; i < this.export_states.length; i++) {
      this.export_states[i] = 'inactive';
    }

    this.tools.audioCutting.status = 'idle';
    this.tools.audioCutting.progressbarType = 'idle';
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.result.filename = '';
    this.tools.audioCutting.result.url = '';
    this.tools.audioCutting.opened = false;
    this.tools.audioCutting.subscriptionIDs = [-1, -1];
    this.visible = false;
    this.subscrmanager.destroy();
  }

  public splitAudio() {
    const cutList = [];
    let startSample = 0;
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.progressbarType = 'info';
    this.tools.audioCutting.result.url = '';

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
    formData.append('files', this.audio.audiomanagers[0].ressource.info.file, this.transcrService.audiofile.name);
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
              this.tools.audioCutting.progress = (!isNullOrUndefined(result2.progress)) ? Math.round(result2.progress * 100) : 0;
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
      }, (error) => {
        this.tools.audioCutting.progressbarType = 'danger';
        this.tools.audioCutting.progress = 100;
        this.tools.audioCutting.status = 'failed';
        this.tools.audioCutting.message = 'API not available. Please send a message via the feedback form.';
        console.error(error);
      }));
  }

  public stopAudioSplitting() {
    for (let i = 0; i < this.tools.audioCutting.subscriptionIDs.length; i++) {
      const subscriptionID = this.tools.audioCutting.subscriptionIDs[i];

      if (subscriptionID > -1) {
        this.subscrmanager.remove(subscriptionID);
      }
      this.tools.audioCutting.subscriptionIDs[i] = -1;
    }

    this.tools.audioCutting.status = 'idle';
  }
}
