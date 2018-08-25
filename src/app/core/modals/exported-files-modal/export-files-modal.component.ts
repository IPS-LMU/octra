import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {BsModalRef, ModalOptions} from 'ngx-bootstrap';
import {Subject} from 'rxjs/Subject';
import {TranscriptionService, UserInteractionsService} from '../../shared/service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AppInfo} from '../../../app.info';
import {Converter, IFile} from '../../obj/Converters';
import {isNullOrUndefined} from 'util';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {OCTRANIMATIONS} from '../../shared';
import {NavbarService} from '../../gui/navbar/navbar.service';
import {OAudiofile} from '../../obj/Annotation';

@Component({
  selector: 'app-export-files-modal',
  templateUrl: './export-files-modal.component.html',
  styleUrls: ['./export-files-modal.component.css'],
  animations: OCTRANIMATIONS
})

export class ExportFilesModalComponent implements OnInit {
  modalRef: BsModalRef;
  protected data = null;
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

  public get arraybufferExists(): boolean {
    return (!isNullOrUndefined(this.navbarServ.transcrService) && !isNullOrUndefined(this.navbarServ.transcrService.audiomanager.ressource.arraybuffer)
      && this.navbarServ.transcrService.audiomanager.ressource.arraybuffer.byteLength > 0);
  }


  public converters = AppInfo.converters;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };

  @ViewChild('modal') modal: any;

  @Input() transcrService: TranscriptionService;
  @Input() uiService: UserInteractionsService;

  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager();

  constructor(private sanitizer: DomSanitizer, private navbarServ: NavbarService) {
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
    this.visible = false;
    this.actionperformed.next();
  }


  onLineClick(converter: Converter, index: number) {
    if (converter.multitiers) {
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
    if (!isNullOrUndefined(this.transcrService) && !isNullOrUndefined(this.transcrService.audiomanager.ressource.arraybuffer)) {
      this.preparing = {
        name: 'Audio',
        preparing: true
      };
      this.parentformat.download = this.transcrService.audiomanager.ressource.name + this.transcrService.audiomanager.ressource.extension;

      window.URL = (((<any> window).URL) ||
        ((<any> window).webkitURL) || false);

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
    if (!this.preparing.preparing) {
      const oannotjson = this.navbarServ.transcrService.annotation.getObj(this.transcrService.audiomanager.sampleRateFactor, this.transcrService.audiomanager.originalInfo.duration.samples);
      this.preparing = {
        name: converter.name,
        preparing: true
      };
      setTimeout(() => {
        if (converter.name === 'Bundle') {
          // only this converter needs an array buffer
          this.navbarServ.transcrService.audiofile.arraybuffer = this.transcrService.audiomanager.ressource.arraybuffer;
        }

        const oAudiofile = new OAudiofile();
        const result: IFile = converter.export(oannotjson, this.navbarServ.transcrService.audiofile, levelnum).file;
        this.parentformat.download = result.name;

        window.URL = (((<any> window).URL) ||
          ((<any> window).webkitURL) || false);

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
    if (!isNullOrUndefined(this.transcrService)) {
      this.preparing = {
        name: 'Protocol',
        preparing: true
      };
      this.parentformat.download = this.transcrService.audiofile.name + '.json';

      window.URL = (((<any> window).URL) ||
        ((<any> window).webkitURL) || false);

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

}
