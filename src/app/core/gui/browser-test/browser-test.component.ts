import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CompatibilityService} from '../../shared/service/compatibility.service';

@Component({
  selector: 'app-browser-test',
  templateUrl: './browser-test.component.html',
  styleUrls: ['./browser-test.component.css']
})
export class BrowserTestComponent implements OnInit {
  constructor(private router: Router, public compatibility:CompatibilityService) {
  }

  ngOnInit() {
  }

  getStateIcon(rule: any): string {
    switch (rule.state) {
      case('processing'):
        return 'spinner';
      case('failed'):
        return 'times';
      case('ok'):
        return 'check';
    }
  }

  getStateColor(rule: any): string {
    switch (rule.state) {
      case('processing'):
        return 'cornflowerblue';
      case('failed'):
        return 'red';
      case('ok'):
        return 'forestgreen';
    }
  }

}
