import { Component, OnInit, ViewChild } from '@angular/core';
import { AudioService, UserInteractionsService } from '../../shared/service';
import { AppInfo } from '../../../app.info';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { timer } from 'rxjs';
import {
  fadeInExpandOnEnterAnimation,
  fadeOutCollapseOnLeaveAnimation,
} from 'angular-animations';
import { NamingDragAndDropComponent } from '../../tools/naming-drag-and-drop/naming-drag-and-drop.component';
import { TableConfiguratorComponent } from '../../tools/table-configurator/table-configurator.component';
import { NavbarService } from '../../component/navbar/navbar.service';
import { OctraModal } from '../types';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { Converter, ExportResult } from '@octra/annotation';

@Component({
  selector: 'octra-export-files-modal',
  templateUrl: './export-files-modal.component.html',
  styleUrls: ['./export-files-modal.component.scss'],
  animations: [
    fadeInExpandOnEnterAnimation(),
    fadeOutCollapseOnLeaveAnimation(),
  ],
})
export class ExportFilesModalComponent extends OctraModal implements OnInit {
  public static options: NgbModalOptions = {
    size: 'xl',
    keyboard: true,
    backdrop: true,
    scrollable: true,
  };

  AppInfo = AppInfo;
  public exportStates: string[] = [];
  public preparing = {
    name: '',
    preparing: false,
  };
  public parentformat: {
    download: string;
    uri: SafeUrl;
  } = {
    download: '',
    uri: '',
  };
  public converters = AppInfo.converters;

  public tools = {
    audioCutting: {
      opened: false,
      selectedMethod: 'client',
      progress: 0,
      result: {
        url: undefined,
        filename: '',
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
      cuttingSpeed: -1,
      cuttingTimeLeft: 0,
      timeLeft: 0,
      wavFormat: undefined,
    },
    tableConfigurator: {
      opened: false,
      numberOfColumns: 3,
      columns: [],
      result: {
        url: undefined,
        filename: '',
      },
    },
  };

  @ViewChild('namingConvention', { static: false })
  namingConvention!: NamingDragAndDropComponent;
  @ViewChild('tableConfigurator', { static: false })
  tableConfigurator!: TableConfiguratorComponent;

  navbarService!: NavbarService;
  uiService!: UserInteractionsService;

  public selectedLevel = 0;

  constructor(
    private sanitizer: DomSanitizer,
    private audio: AudioService,
    public annotationStoreService: AnnotationStoreService,
    protected override activeModal: NgbActiveModal
  ) {
    super('ExportFilesModalComponent', activeModal);
  }

  ngOnInit() {
    this.uiService.addElementFromEvent(
      'export',
      {
        value: 'opened',
      },
      Date.now(),
      this.audio.audioManager.playPosition,
      undefined,
      undefined,
      undefined,
      'modals'
    );

    for (const converter of AppInfo.converters) {
      this.exportStates.push('close');
    }

    if (this.tableConfigurator) {
      this.tableConfigurator.updateAllTableCells();
    }
  }

  public override close() {
    this.uiService.addElementFromEvent(
      'export',
      {
        value: 'closed',
      },
      Date.now(),
      this.audio.audiomanagers[0].playPosition,
      undefined,
      undefined,
      undefined,
      'modals'
    );

    return super.close();
  }

  onLineClick(converter: Converter, index: number) {
    if (
      converter.multitiers ||
      (!converter.multitiers &&
        this.annotationStoreService.transcript!.levels.length === 1)
    ) {
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
      window.URL.revokeObjectURL(this.parentformat!.uri.toString());
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
      if (this.annotationStoreService.transcript?.levels === undefined) {
        console.error(`annotation is undefined!`);
        return;
      }
      const oannotjson = this.annotationStoreService.transcript?.serialize(
        `${this.audio.audioManager.resource.info.name}_annot.json`,
        this.audio.audioManager.sampleRate,
        this.audio.audioManager.resource.info.duration
      );
      this.preparing = {
        name: converter.name,
        preparing: true,
      };
      this.subscribe(timer(300), () => {
        if (converter.name === 'BundleJSON') {
          // only this converter needs an array buffer
          /*
            this.transcriptionService.audiofile.arraybuffer =
              this.transcriptionService.audioManager.resource.arraybuffer!;
             */
        }

        const oAudioFile = this.audio.audioManager.resource.getOAudioFile();
        const result: ExportResult = converter.export(
          oannotjson,
          oAudioFile,
          levelnum
        );

        if (!result.error && result.file) {
          this.parentformat.download = result.file.name;

          if (this.parentformat.uri !== undefined) {
            window.URL.revokeObjectURL(this.parentformat.uri.toString());
          }
          const test = new File([result.file.content], result.file.name);
          this.setParentFormatURI(window.URL.createObjectURL(test));
          this.preparing = {
            name: converter.name,
            preparing: false,
          };
        } else {
          console.error(`Annotation conversion error: ${result.error}`);
        }
      });
    }
  }

  getProtocol() {
    this.preparing = {
      name: 'Protocol',
      preparing: true,
    };
    this.parentformat.download =
      this.audio.audioManager.resource.info.name + '.json';

    if (this.parentformat.uri !== undefined) {
      window.URL.revokeObjectURL(this.parentformat.uri.toString());
    }
    const json = new File(
      [
        JSON.stringify(
          this.annotationStoreService.extractUI(this.uiService.elements),
          undefined,
          2
        ),
      ],
      this.parentformat.download
    );
    this.setParentFormatURI(window.URL.createObjectURL(json));
    this.preparing = {
      name: 'Protocol',
      preparing: false,
    };
  }

  onDownloadClick(i: number) {
    this.subscribe(timer(500), () => {
      this.exportStates[i] = 'inactive';
    });
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
    this.subscriptionManager.destroy();

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
