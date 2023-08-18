import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService, UserInteractionsService } from '../../shared/service';
import { DefaultComponent } from '../../component/default.component';

@Component({
  selector: 'octra-members-area',
  templateUrl: './intern.component.html',
  styleUrls: ['./intern.component.scss'],
  providers: [UserInteractionsService],
})
export class InternComponent extends DefaultComponent {
  constructor(private router: Router, private settService: SettingsService) {
    super();
    document.body.setAttribute('style', 'overflow:hidden');
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    document.body.removeAttribute('style');
  }
}
