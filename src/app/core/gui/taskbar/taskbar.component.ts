import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SessionService} from '../../shared/service/session.service';

@Component({
  selector: 'app-fastbar',
  templateUrl: './taskbar.component.html',
  styleUrls: ['./taskbar.component.css']
})
export class FastbarComponent implements OnInit {

  @Input() responsive = false;
  @Input() button_labels: any = {
    shortcuts: 'Shortcuts',
    guidelines: 'Guidlines',
    overview: 'Overview',
    help: 'Help'
  };

  @Output() shortcutbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() guidelinesbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() overviewbtnclicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(public sessService: SessionService) {
  }

  ngOnInit() {
  }
}
