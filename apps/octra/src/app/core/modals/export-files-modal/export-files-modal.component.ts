import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {AudioService, SettingsService, TranscriptionService, UserInteractionsService} from '../../shared/service';
import {AppInfo} from '../../../app.info';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {Subject, Subscription, timer} from 'rxjs';
import {DragulaService} from 'ng2-dragula';
import {fadeInExpandOnEnterAnimation, fadeOutCollapseOnLeaveAnimation} from 'angular-animations';
import {NamingDragAndDropComponent} from '../../tools/naming-drag-and-drop/naming-drag-and-drop.component';
import {TableConfiguratorComponent} from '../../tools/table-configurator/table-configurator.component';
import {SubscriptionManager} from '@octra/utilities';
import {NavbarService} from '../../component/navbar/navbar.service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {Converter, IFile} from '@octra/annotation';
import {MdbModalConfig, MdbModalRef, MdbModalService} from 'mdb-angular-ui-kit/modal';

@Component({
  selector: 'octra-export-files-modal',
  templateUrl: './export-files-modal.component.html',
  styleUrls: ['./export-files-modal.component.css'],
  animations: [
    fadeInExpandOnEnterAnimation(),
    fadeOutCollapseOnLeaveAnimation()
  ]
})
export class ExportFilesModalComponent implements OnInit, OnDestroy {
  modalRef: MdbModalRef<ExportFilesModalComponent>;
  AppInfo = AppInfo;
  public visible = false;
  public exportStates = [];
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
  config: MdbModalConfig = {
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
        url: undefined,
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
      clientStreamHelper: undefined,
      zippingSpeed: -1,
      cuttingSpeed: -1,
      cuttingTimeLeft: 0,
      timeLeft: 0,
      wavFormat: undefined
    },
    tableConfigurator: {
      opened: false,
      numberOfColumns: 3,
      columns: [],
      result: {
        url: undefined,
        filename: ''
      }
    }
  };

  @ViewChild('modal', {static: true}) modal: any;
  @ViewChild('namingConvention', {static: false}) namingConvention: NamingDragAndDropComponent;
  @ViewChild('content', {static: false}) contentElement: ElementRef;
  @ViewChild('tableConfigurator', {static: false}) tableConfigurator: TableConfiguratorComponent;

  @Input() transcrService: TranscriptionService;
  @Input() uiService: UserInteractionsService;
  protected data = undefined;
  private actionperformed: Subject<void> = new Subject<void>();
  private subscrmanager = new SubscriptionManager<Subscription>();
  public selectedLevel = 0;

  constructor(private sanitizer: DomSanitizer,
              public navbarServ: NavbarService,
              private modalService: MdbModalService,
              private httpClient: HttpClient,
              private appStorage: AppStorageService,
              private audio: AudioService,
              private settService: SettingsService,
              private dragulaService: DragulaService) {
    this.dragulaService.createGroup('tableConfiguratorColumns', {
      revertOnSpill: true,
      removeOnSpill: false
    });
  }

  ngOnInit() {
    for (const converter of AppInfo.converters) {
      this.exportStates.push('inactive');
    }
  }

  public open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.modal.show(this.modal, this.config);
      this.uiService.addElementFromEvent('export', {
        value: 'opened'
      }, Date.now(), this.audio.audiomanagers[0].playposition, -1, undefined, undefined, 'modals');

      this.visible = true;
      if (this.tableConfigurator !== undefined) {
        this.tableConfigurator.updateAllTableCells();
      }

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

    this.uiService.addElementFromEvent('export', {
      value: 'closed'
    }, Date.now(), this.audio.audiomanagers[0].playposition, -1, undefined, undefined, 'modals');

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
    for (let i = 0; i < this.exportStates.length; i++) {
      if (this.exportStates[i] === 'active') {
        this.exportStates[i] = 'close';
      }
    }

    if (index < this.exportStates.length) {
      if (this.exportStates[index] === 'active') {
        this.exportStates[index] = 'inactive';
      } else {
        this.exportStates[index] = 'active';
      }
    }
  }

  private setParentFormatURI(url: string) {
    if (this.parentformat.uri !== undefined) {
      window.URL.revokeObjectURL(this.parentformat.uri['changingThisBreaksApplicationSecurity']);
    }
    this.parentformat.uri = this.sanitize(url);
  }

  onSelectionChange(converter: Converter, value: any) {
    if (value !== '') {
      this.updateParentFormat(converter, value);
    }
  }

  updateParentFormat(converter: Converter, levelnum?: number) {
    if (levelnum === undefined && !converter.multitiers) {
      levelnum = 0;
    }

    if (!this.preparing.preparing) {
      const oannotjson = this.navbarServ.transcrService.annotation.getObj(this.transcrService.audioManager.ressource.info.duration);
      this.preparing = {
        name: converter.name,
        preparing: true
      };
      this.subscrmanager.add(timer(300).subscribe(
        () => {
          if (converter.name === 'Bundle') {
            // only this converter needs an array buffer
            this.navbarServ.transcrService.audiofile.arraybuffer = this.transcrService.audioManager.ressource.arraybuffer;
          }

          const result: IFile = converter.export(oannotjson, this.navbarServ.transcrService.audiofile, levelnum).file;

          this.parentformat.download = result.name;

          if (this.parentformat.uri !== undefined) {
            window.URL.revokeObjectURL(this.parentformat.uri.toString());
          }
          const test = new File([result.content], result.name);
          this.setParentFormatURI(window.URL.createObjectURL(test));
          this.preparing = {
            name: converter.name,
            preparing: false
          };
        }
      ));
    }
  }

  getProtocol() {
    if (!(this.transcrService === undefined || this.transcrService === undefined)) {
      this.preparing = {
        name: 'Protocol',
        preparing: true
      };
      this.parentformat.download = this.transcrService.audiofile.name + '.json';

      if (this.parentformat.uri !== undefined) {
        window.URL.revokeObjectURL(this.parentformat.uri.toString());
      }
      const json = new File([JSON.stringify(this.transcrService.extractUI(this.uiService.elements), undefined, 2)], this.parentformat.download);
      this.setParentFormatURI(window.URL.createObjectURL(json));
      this.preparing = {
        name: 'Protocol',
        preparing: false
      };
    } else {
      console.error('can\'t get protocol file');
    }
  }

  onDownloadClick(i: number) {
    this.subscrmanager.add(timer(500).subscribe(() => {
      this.exportStates[i] = 'inactive';
    }));
  }

  ngOnDestroy() {
    this.subscrmanager.destroy();
  }

  onHidden() {
    for (let i = 0; i < this.exportStates.length; i++) {
      this.exportStates[i] = 'inactive';
    }

    this.tools.audioCutting.status = 'idle';
    this.tools.audioCutting.progressbarType = 'idle';
    this.tools.audioCutting.progressbarType = 'idle';
    this.tools.audioCutting.progress = 0;
    this.tools.audioCutting.result.filename = '';
    this.tools.audioCutting.result.url = undefined;
    this.tools.audioCutting.opened = false;
    this.tools.audioCutting.subscriptionIDs = [-1, -1];
    this.visible = false;
    this.subscrmanager.destroy();

    if (this.tools.audioCutting.result.url !== undefined) {
      window.URL.revokeObjectURL(this.tools.audioCutting.result.url);
    }

    if (this.parentformat.uri !== undefined) {
      const url = this.parentformat.uri.toString();
      window.URL.revokeObjectURL(url);
    }
  }

  onPlaintextTimestampOptionChanged(converter: Converter) {
    this.updateParentFormat(converter, this.selectedLevel);
  }
}
