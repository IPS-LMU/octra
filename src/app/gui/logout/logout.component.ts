import {Component, OnInit} from '@angular/core';

import {Router} from '@angular/router';
import {SessionService} from '../../service/session.service';
import {SettingsService} from '../../service/settings.service';

@Component({

  selector: 'app-login',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  valid = false;

  member = {
    id: '',
    pw: ''
  };

  constructor(private router: Router,
              private sessionService: SessionService,
              private settingsService: SettingsService) {
  }

  ngOnInit() {
    this.settingsService.clearSettings();
    this.sessionService.endSession(this.sessionService.offline, () => {
      this.router.navigate(['login']);
    });
  }
}
