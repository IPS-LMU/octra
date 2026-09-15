import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { QuestionMarkComponent } from '../question-mark/question-mark.component';
import { ToolConfigArrayAdderComponent } from './array-adder/toolconfig-array-adder.component';
import { ToolconfigArrayControlComponent } from './array-control/toolconfig-array-control.component';
import { ToolConfiguratorComponent } from './tool-configurator.component';
import { ToolconfigGroupComponent } from './toolconfig-group/toolconfig-group.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    NgbPopover,
    QuestionMarkComponent,
    TranslocoPipe,
    ToolConfiguratorComponent,
    ToolconfigGroupComponent,
    ToolConfigArrayAdderComponent,
    ToolconfigArrayControlComponent,
  ],
  exports: [
    ToolConfiguratorComponent,
    ToolconfigGroupComponent,
    ToolConfigArrayAdderComponent,
    ToolconfigArrayControlComponent,
  ],
})
export class OctraFormGeneratorModule {}
