import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DefaultComponent } from '../../component/default.component';
import { SettingsService, UserInteractionsService } from '../../shared/service';

@Component({
  selector: 'octra-members-area',
  templateUrl: './intern.component.html',
  styleUrls: ['./intern.component.scss'],
  providers: [UserInteractionsService],
  imports: [RouterOutlet],
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
