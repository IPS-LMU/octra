import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, ViewEncapsulation } from '@angular/core';
import { ControlContainer, FormsModule } from '@angular/forms';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { QuestionMarkComponent } from '../../question-mark/question-mark.component';
import { ToolconfigArrayControlComponent } from '../array-control/toolconfig-array-control.component';
import { ConfigurationControlGroup, OctraToolConfiguratorOptions } from '../tool-configurator.component';

@Component({
  selector: 'octra-toolconfig-group',
  templateUrl: './toolconfig-group.component.html',
  styleUrls: ['./toolconfig-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
  imports: [QuestionMarkComponent, NgStyle, FormsModule, NgClass, ToolconfigArrayControlComponent, NgTemplateOutlet],
  // Bridges the ancestor <form>'s NgForm into this component's view: NgModel injects its
  // ControlContainer parent with @Host(), which stops at the component boundary, so without
  // this the inputs here would never register with the outer NgForm and it would stay "valid".
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
})
export class ToolconfigGroupComponent extends SubscriberComponent {
  @Input() group?: ConfigurationControlGroup;
  @Input() options!: OctraToolConfiguratorOptions;
  @Output() somethingChanged = new EventEmitter<void>();
}
