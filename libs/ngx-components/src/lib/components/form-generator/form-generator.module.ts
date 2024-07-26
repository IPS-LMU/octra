import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolConfiguratorComponent } from './tool-configurator.component';
import { ToolconfigGroupComponent } from './toolconfig-group/toolconfig-group.component';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { ToolConfigArrayAdderComponent } from './array-adder/toolconfig-array-adder.component';
import { QuestionMarkComponent } from '../question-mark/question-mark.component';
import { TranslocoPipe } from '@jsverse/transloco';

@NgModule({
  declarations: [
    ToolConfiguratorComponent,
    ToolconfigGroupComponent,
    ToolConfigArrayAdderComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbPopover,
    QuestionMarkComponent,
    TranslocoPipe,
  ],
  exports: [
    ToolConfiguratorComponent,
    ToolconfigGroupComponent,
    ToolConfigArrayAdderComponent,
  ],
})
export class OctraFormGeneratorModule {}
