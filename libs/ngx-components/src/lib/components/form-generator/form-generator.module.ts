import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { QuestionMarkComponent } from '../question-mark/question-mark.component';
import { OctraFormArrayAdderComponent } from './array-adder/octra-form-array-adder.component';
import { OctraFormArrayControlComponent } from './array-control/octra-form-array-control.component';
import { OctraFormNumberControlComponent } from './number-control/octra-form-number-control.component';
import { OctraFormSelectControlComponent } from './select-control/octra-form-select-control.component';
import { OctraFormSwitchControlComponent } from './switch-control/octra-form-switch-control.component';
import { OctraFormTextControlComponent } from './text-control/octra-form-text-control.component';
import { OctraFormConfiguratorComponent } from './octra-form-configurator.component';
import { OctraFormGroupComponent } from './toolconfig-group/octra-form-group.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    NgbPopover,
    QuestionMarkComponent,
    TranslocoPipe,
    OctraFormConfiguratorComponent,
    OctraFormGroupComponent,
    OctraFormArrayAdderComponent,
    OctraFormArrayControlComponent,
    OctraFormSelectControlComponent,
    OctraFormSwitchControlComponent,
    OctraFormNumberControlComponent,
    OctraFormTextControlComponent,
  ],
  exports: [
    OctraFormConfiguratorComponent,
    OctraFormGroupComponent,
    OctraFormArrayAdderComponent,
    OctraFormArrayControlComponent,
    OctraFormSelectControlComponent,
    OctraFormSwitchControlComponent,
    OctraFormNumberControlComponent,
    OctraFormTextControlComponent,
  ],
})
export class OctraFormGeneratorModule {}
