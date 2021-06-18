import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';
import {Subject} from 'rxjs';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {AnnotJSONConverter, OAudiofile, PartiturConverter, TextConverter} from '@octra/annotation';

@Component({
  selector: 'octra-prompt-modal',
  templateUrl: './prompt-modal.component.html',
  styleUrls: ['./prompt-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class PromptModalComponent{
  modalRef: BsModalRef;
  public visible = false;

  config: ModalOptions = {
    keyboard: false,
    backdrop: false,
    ignoreBackdropClick: false
  };
  @ViewChild('modal', {static: true}) modal: any;
  public formatConverter;
  protected data = null;
  private actionperformed: Subject<void> = new Subject<void>();

  constructor(private modalService: BsModalService, public appStorage: AppStorageService, private settService: SettingsService,
              private cd: ChangeDetectorRef) {
  }

  public open(audiofile: OAudiofile): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let found = false;
      if (this.formatConverter === undefined) {
        for (const converter of AppInfo.converters) {
          if (converter instanceof AnnotJSONConverter || converter instanceof PartiturConverter) {
            const result = converter.import({
              name: audiofile.name,
              content: this.appStorage.prompttext,
              type: 'text',
              encoding: 'utf8'
            }, audiofile);

            if (result !== null && result !== undefined
              && result.annotjson !== null && result.annotjson.levels.length > 0
              && result.annotjson.levels[0] !== null
              && !(converter instanceof TextConverter)) {
              this.formatConverter = converter;
              found = true;
              break;
            }
          }
        }
        if (!found) {
          this.formatConverter = null;
        }
      }

      this.modal.show(this.modal, this.config);
      this.visible = true;
      this.cd.markForCheck();
      this.cd.detectChanges();

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
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
}
