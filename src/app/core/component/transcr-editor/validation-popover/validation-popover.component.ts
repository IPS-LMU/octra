import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-validation-popover',
  templateUrl: './validation-popover.component.html',
  styleUrls: ['./validation-popover.component.css']
})
export class ValidationPopoverComponent implements OnInit {

  @Input() guideline: {
    'code': string,
    'priority': number,
    'title': string,
    'description': string,
    'examples': any[]
  };

  constructor() {
  }

  ngOnInit() {
  }

}
