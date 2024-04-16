import { Component, ElementRef, ViewChild } from '@angular/core';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { DefaultComponent } from '../../component/default.component';
import { getBaseHrefURL, joinURL } from '@octra/utilities';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.scss'],
})
export class HelpToolsComponent extends DefaultComponent {
  @ViewChild('canvas', { static: false }) canvas!: ElementRef;

  constructor(private appStorage: AppStorageService) {
    super();
  }

  refreshApp() {
    document.location.reload();
  }

  clearAllData() {
    this.appStorage.clearWholeSession().then(() => {
      setTimeout(() => {
        document.location.href = joinURL(getBaseHrefURL(), 'login');
      }, 1000);
    });
  }
}
