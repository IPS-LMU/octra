import {Component, OnInit} from '@angular/core';
import {SettingsService} from '../../shared/service/settings.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {AppStorageService} from '../../shared/service/appstorage.service';
import {SubscriptionManager} from '../../obj/SubscriptionManager';
import {AppInfo} from '../../../app.info';
import {Functions} from '../../shared/Functions';

@Component({
  selector: 'app-agreement',
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.css']
})
export class AgreementComponent implements OnInit {

  private subscrmanager: SubscriptionManager = new SubscriptionManager();

  constructor(public settService: SettingsService,
              private router: Router,
              private langService: TranslateService,
              private appStorage: AppStorageService) {
    if ((this.settService.projectsettings === null || this.settService.projectsettings === undefined)) {
      Functions.navigateTo(this.router, ['/user/load'], AppInfo.queryParamsHandling);
    }
  }


  ngOnInit() {
    console.log('agreement component called');
  }

  public toHTML(text: any): string {
    if (!(text === null || text === undefined)) {
      if (!(text[this.langService.currentLang] === null || text[this.langService.currentLang] === undefined)) {
        return text[this.langService.currentLang].replace('\n', '<br/>');
      } else {
        for (const l in text) {
          if (!(text[l] === null || text[l] === undefined)) {
            return text[l].replace('\n', '<br/>');
          }
        }
      }
    } else {
      return '';
    }
  }

  logout() {
    this.settService.clearSettings();
    Functions.navigateTo(this.router, ['/logout'], AppInfo.queryParamsHandling);
  }

  accept() {
    if ((this.appStorage.agreement === null || this.appStorage.agreement === undefined)) {
      this.appStorage.agreement = {};
    }
    this.appStorage.agreement[this.appStorage.user.project] = true;
    this.appStorage.sessStr.store('agreement', this.appStorage.agreement);
    Functions.navigateTo(this.router, ['/user/transcr'], AppInfo.queryParamsHandling);
  }
}
