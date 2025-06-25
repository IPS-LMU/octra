import { NgStyle } from '@angular/common';
import { Component, inject, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { navigateTo } from '@octra/ngx-utilities';
import { AppInfo } from '../../../app.info';
import { DefaultComponent } from '../../component/default.component';
import { AudioService, SettingsService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { LoadingStatus } from '../../store';
import { ApplicationStoreService } from '../../store/application/application-store.service';

@Component({
  selector: 'octra-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
  imports: [NgStyle],
})
export class LoadingComponent extends DefaultComponent implements OnInit {
  private langService = inject(TranslocoService);
  settService = inject(SettingsService);
  appStorage = inject(AppStorageService);
  appStoreService = inject(ApplicationStoreService);
  audio = inject(AudioService);
  private router = inject(Router);

  @Output() loaded = false;
  public text = '';
  public state = '';
  public warning = '';

  loading: {
    status: LoadingStatus;
    progress: number;
    errors: string[];
  } = {
    status: LoadingStatus.INITIALIZE,
    progress: 0,
    errors: [],
  };

  ngOnInit() {
    this.langService
      .selectTranslate('g.please wait')
      .subscribe((translation) => {
        this.text = translation + '... ';
      });

    this.subscribe(this.appStoreService.loading$, {
      next: (loading) => {
        this.loading = loading;
      },
    });
  }

  retry() {
    location.reload();
  }

  goBack() {
    this.appStorage.logout();
    navigateTo(this.router, ['/login'], AppInfo.queryParamsHandling).catch(
      (error) => {
        console.error(error);
      },
    );
  }
}
