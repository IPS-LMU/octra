import { Component, OnInit } from '@angular/core';
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
  constructor(private appService: ApplicationStoreService) {
    super();
  }

  ngOnInit() {
    const bc = new BroadcastChannel('ocb_authentication');
    bc.postMessage(true);
    bc.close();
    window.close();
  }
}
