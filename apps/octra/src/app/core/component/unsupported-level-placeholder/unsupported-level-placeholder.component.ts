import { Component } from '@angular/core';
import { AnnotationLevelType } from '@octra/annotation';
import { DefaultComponent } from '../default.component';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'octra-unsupported-level-placeholder',
  templateUrl: './unsupported-level-placeholder.component.html',
  styleUrls: ['./unsupported-level-placeholder.component.scss'],
  imports: [TranslocoPipe],
})
export class UnsupportedLevelPlaceholderComponent extends DefaultComponent {
  editorName = '';
  levelType?: AnnotationLevelType;
}
