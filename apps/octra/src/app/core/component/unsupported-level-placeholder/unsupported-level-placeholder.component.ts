import { Component } from '@angular/core';
import { AnnotationLevelType } from '@octra/annotation';
import {
  fadeInOnEnterAnimation,
  fadeOutOnLeaveAnimation,
} from 'angular-animations';
import { DefaultComponent } from '../default.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'octra-unsupported-level-placeholder',
  templateUrl: './unsupported-level-placeholder.component.html',
  styleUrls: ['./unsupported-level-placeholder.component.scss'],
  animations: [fadeInOnEnterAnimation(), fadeOutOnLeaveAnimation()],
  imports: [TranslocoPipe],
})
export class UnsupportedLevelPlaceholderComponent extends DefaultComponent {
  editorName = '';
  levelType?: AnnotationLevelType;
}
