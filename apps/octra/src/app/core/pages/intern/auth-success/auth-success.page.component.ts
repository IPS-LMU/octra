import { Component, OnInit } from '@angular/core';
import {DefaultComponent} from '../../../component/default.component';
import {ApplicationStoreService} from '../../../store/application/application-store.service';

@Component({
  selector: 'ocb-re-authentication-page',
  templateUrl: './auth-success.page.component.html',
  styleUrls: ['./auth-success.page.component.scss'],
})
export class AuthSuccessPageComponent extends DefaultComponent implements OnInit {
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
