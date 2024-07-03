import { Component, Input, ViewEncapsulation } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: true,
  selector: 'octra-question-mark',
  templateUrl: './question-mark.component.html',
  styleUrls: ['./question-mark.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [NgbPopover],
})
export class QuestionMarkComponent {
  @Input() text = '';
}
