import {Component, OnInit} from '@angular/core';

import {Router} from '@angular/router';
import {Functions} from '@octra/components';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';

@Component({

  selector: 'octra-login',
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
      Functions.navigateTo(this.router, ['login'], AppInfo.queryParamsHandling).catch((error) => {
        console.error(error);
      });
    });
  }
}
