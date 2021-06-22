import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {CompatibilityService} from '../../shared/service/compatibility.service';
import {BrowserInfo} from '@octra/utilities';

@Component({
  selector: 'octra-browser-test',
  templateUrl: './browser-test.component.html',
  styleUrls: ['./browser-test.component.scss']
})
export class BrowserTestComponent {

  public get browserName(): string {
    return BrowserInfo.browser;
  }

  constructor(private router: Router, public compatibility: CompatibilityService) {
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
    return 'spinner';
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
    return 'processing';
  }

  test() {
    window.location.href = 'chrome://settings/content/cookies';
  }

}
