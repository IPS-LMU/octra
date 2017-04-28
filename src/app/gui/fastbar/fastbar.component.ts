import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SessionService} from '../../service/session.service';

@Component({
  selector: 'app-fastbar',
  templateUrl: './fastbar.component.html',
  styleUrls: ['./fastbar.component.css']
})
export class FastbarComponent implements OnInit {

  @Input() responsive = false;
  @Input() help_url = '';
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
