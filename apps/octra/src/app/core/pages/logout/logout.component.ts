import {Component, OnInit} from '@angular/core';

import {Router} from '@angular/router';
import {AppInfo} from '../../../app.info';
import {SettingsService} from '../../shared/service';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {Functions} from '@octra/utilities';
import {Store} from '@ngrx/store';
import * as fromLoginActions from '../../store/login/login.actions';

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
              private appStorage: AppStorageService,
              private settingsService: SettingsService,
              private store: Store) {
  }

  ngOnInit() {
    this.settingsService.clearSettings();
    this.appStorage.endSession().then(() => {
      this.store.dispatch(fromLoginActions.logout());
      Functions.navigateTo(this.router, ['login'], AppInfo.queryParamsHandling).catch((error) => {
        console.error(error);
      });
    });
  }
}
