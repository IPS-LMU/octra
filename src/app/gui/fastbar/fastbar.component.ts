import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-fastbar',
  templateUrl: './fastbar.component.html',
  styleUrls: ['./fastbar.component.css']
})
export class FastbarComponent implements OnInit {

  @Input() responsive:boolean = false;
  @Input() help_url:string = "";
  @Input() button_labels:any = {
    shortcuts: "Shortcuts",
    guidelines: "Guidlines",
    overview: "Overview",
    help: "Help"
  };

  @Output() shortcutbtnclicked:EventEmitter<void> = new EventEmitter<void>();
  @Output() guidelinesbtnclicked:EventEmitter<void> = new EventEmitter<void>();
  @Output() overviewbtnclicked:EventEmitter<void> = new EventEmitter<void>();

  constructor() { }

  ngOnInit() {
  }
}
