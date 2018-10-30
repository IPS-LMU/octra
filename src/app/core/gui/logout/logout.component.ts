import {Component, OnInit} from '@angular/core';

import {Router} from '@angular/router';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SettingsService} from '../../shared/service/settings.service';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';

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
              private sessionService: AppStorageService,
              private settingsService: SettingsService) {
  }

  ngOnInit() {
    this.settingsService.clearSettings();
    this.sessionService.endSession(() => {
      Functions.navigateTo(this.router, ['login'], AppInfo.queryParamsHandling);
    });
  }
}
