import { Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Converter } from '@octra/annotation';
import { OctraFormGeneratorModule } from '@octra/ngx-components';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { OctraModal } from '../types';

@Component({
  selector: 'octra-import-options-modal',
  templateUrl: './import-options-modal.component.html',
  styleUrls: ['./import-options-modal.component.scss'],
  imports: [OctraFormGeneratorModule, TranslocoPipe],
})
export class ImportOptionsModalComponent extends OctraModal implements OnInit {
  annotationStoreService = inject(AnnotationStoreService);
  protected override activeModal: NgbActiveModal;
  private transloco = inject(TranslocoService);

  public static options: NgbModalOptions = {
    keyboard: false,
    backdrop: 'static',
    scrollable: true,
    size: 'lg',
  };

  converter?: Converter;
  schema: any = undefined;
  value: any = undefined;
  jsonText = '';

  constructor() {
    const activeModal = inject(NgbActiveModal);

    super('importOptionsModal', activeModal);

    this.activeModal = activeModal;
  }

  ngOnInit() {
    if (this.schema && this.converter) {
      const root = `converters.${this.converter.name}.options`;
      for (const key of Object.keys(this.schema.properties)) {
        const propertyDefinition = this.schema.properties[key];
        if (propertyDefinition.title) {
          propertyDefinition.title =
            this.transloco.translate(`${root}.${key}.title`) ??
            propertyDefinition.title;
          propertyDefinition.description =
            this.transloco.translate(`${root}.${key}.description`) ??
            propertyDefinition.description;
        }
      }
    }
    this.jsonText = JSON.stringify(this.value);
  }

  public override close(action?: string) {
    return super.close({
      action,
      result: this.value,
    });
  }

  onJsonTextChange(json: string) {
    try {
      this.value = JSON.parse(json);
    } catch (e) {
      console.error(e);
    }
  }
}
