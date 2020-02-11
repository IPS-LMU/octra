import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'app-error-occurred',
  templateUrl: './error-occurred.component.html',
  styleUrls: ['./error-occurred.component.css']
})
export class ErrorOccurredComponent implements OnInit {
  public static componentName = 'ErrorOccurredComponent';

  constructor() {
  }

  ngOnInit(): void {
  }

}
