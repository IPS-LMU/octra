import { NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BrowserInfo } from '@octra/web-media';
import { CompatibilityService } from '../../shared/service/compatibility.service';

@Component({
  selector: 'octra-browser-test',
  templateUrl: './browser-test.component.html',
  styleUrls: ['./browser-test.component.scss'],
  imports: [NgStyle, RouterLink],
})
export class BrowserTestComponent {
  private router = inject(Router);
  compatibilityService = inject(CompatibilityService);

  public get browserName(): string {
    return BrowserInfo.browser!;
  }

  getStateIcon(rule: any) {
    switch (rule.state) {
      case 'processing':
        return 'bi bi-spinner';
      case 'failed':
        return 'bi bi-x-lg';
      case 'ok':
        return 'bi bi-check-lg';
    }
    return 'spinner';
  }

  getStateColor(rule: any): string {
    switch (rule.state) {
      case 'processing':
        return 'cornflowerblue';
      case 'failed':
        return 'red';
      case 'ok':
        return 'forestgreen';
    }
    return 'processing';
  }

  test() {
    window.location.href = 'chrome://settings/content/cookies';
  }
}
