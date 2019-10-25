import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {CompatibilityService} from '../../shared/service/compatibility.service';
import {BrowserInfo} from '../../shared';

@Component({
  selector: 'app-browser-test',
  templateUrl: './browser-test.component.html',
  styleUrls: ['./browser-test.component.css']
})
export class BrowserTestComponent implements OnInit {

  public get browserName(): string {
    return BrowserInfo.browser;
  }

  constructor(private router: Router, public compatibility: CompatibilityService) {
  }

  ngOnInit() {
  }

  getStateIcon(rule: any): 'spinner' | 'times' | 'check' {
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

  test() {
    window.location.href = 'chrome://settings/content/cookies';
  }

}
