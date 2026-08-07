import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DefaultComponent } from '../../component/default.component';
import { SettingsService, UserInteractionsService } from '../../shared/service';

@Component({
  selector: 'octra-members-area',
  templateUrl: './intern.component.html',
  styleUrls: ['./intern.component.scss'],
  providers: [UserInteractionsService],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterOutlet],
})
export class InternComponent extends DefaultComponent {
  private router = inject(Router);
  private settService = inject(SettingsService);

  constructor() {
    super();
    document.body.setAttribute('style', 'overflow:hidden');
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    document.body.removeAttribute('style');
  }
}
