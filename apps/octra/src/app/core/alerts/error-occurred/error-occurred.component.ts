import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'octra-error-occurred',
  templateUrl: './error-occurred.component.html',
  styleUrls: ['./error-occurred.component.scss'],
  imports: [TranslocoPipe, RouterLink],
})
export class ErrorOccurredComponent {
  public static componentName = 'ErrorOccurredComponent';
}
