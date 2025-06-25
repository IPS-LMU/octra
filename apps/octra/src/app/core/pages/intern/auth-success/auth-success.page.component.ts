import { Component, inject, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { DefaultComponent } from '../../../component/default.component';
import { ApplicationStoreService } from '../../../store/application/application-store.service';

@Component({
  selector: 'octra-re-authentication-page',
  templateUrl: './auth-success.page.component.html',
  styleUrls: ['./auth-success.page.component.scss'],
  imports: [TranslocoPipe],
})
export class AuthSuccessPageComponent
  extends DefaultComponent
  implements OnInit
{
  private appService = inject(ApplicationStoreService);

  ngOnInit() {
    const bc = new BroadcastChannel('ocb_authentication');
    bc.postMessage(true);
    bc.close();
    window.close();
  }
}
