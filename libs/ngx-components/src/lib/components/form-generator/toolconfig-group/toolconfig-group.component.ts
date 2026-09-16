import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { ControlContainer, FormsModule } from '@angular/forms';
import { SubscriberComponent } from '@octra/ngx-utilities';
import { QuestionMarkComponent } from '../../question-mark/question-mark.component';
import { ToolconfigArrayControlComponent } from '../array-control/toolconfig-array-control.component';
import { ToolconfigNumberControlComponent } from '../number-control/toolconfig-number-control.component';
import { ToolconfigSelectControlComponent } from '../select-control/toolconfig-select-control.component';
import { ToolconfigSwitchControlComponent } from '../switch-control/toolconfig-switch-control.component';
import { ToolconfigTextControlComponent } from '../text-control/toolconfig-text-control.component';
import { OctraToolConfiguratorOptions } from '../tool-configurator.component';
import { ConfigurationControlGroup } from '../objects';

@Component({
  selector: 'octra-toolconfig-group',
  templateUrl: './toolconfig-group.component.html',
  styleUrls: ['./toolconfig-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
  imports: [
    QuestionMarkComponent,
    NgStyle,
    FormsModule,
    NgClass,
    ToolconfigArrayControlComponent,
    ToolconfigSelectControlComponent,
    ToolconfigSwitchControlComponent,
    ToolconfigNumberControlComponent,
    ToolconfigTextControlComponent,
    NgTemplateOutlet,
  ],
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
export class ToolconfigGroupComponent extends SubscriberComponent implements OnChanges {
  @Input() group?: ConfigurationControlGroup;
  @Input() showToggles = false;
  @Input() options!: OctraToolConfiguratorOptions;
  @Output() somethingChanged = new EventEmitter<void>();

  private elRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  firstVisibleControl = -1;

  constructor() {
    super();
    if (this.elRef) {
      this.renderer.addClass(this.elRef.nativeElement, 'ocf-control-group');
    }
  }

  ngOnChanges(changes: SimpleChanges<ToolconfigGroupComponent>) {
    const group = changes.group;
    if (group && group.currentValue) {
      this.firstVisibleControl = group.currentValue.controls.findIndex((a) => !a.ignore && a.type !== 'group');
      console.log(group);
    }
  }
}
