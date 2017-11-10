import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {isNullOrUndefined} from 'util';
import {SettingsService} from '../../shared/service/settings.service';
import {ProjectSettings} from '../../obj/Settings/project-configuration';
import {NavbarService} from '../navbar/navbar.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsComponent implements OnInit, OnChanges {

  @Input() url;

  public get projectsettings(): ProjectSettings {
    return this.settService.projectsettings;
  }

  constructor(private sanitizer: DomSanitizer,
              private cd: ChangeDetectorRef,
              public settService: SettingsService,
              private navService: NavbarService) {
  }

  ngOnInit() {
    this.navService.show_interfaces = false;
    this.navService.show_export = false;
  }

  ngOnChanges(obj) {
    if (!isNullOrUndefined(obj.url)) {
      this.cd.markForCheck();
      this.cd.checkNoChanges();
    }
  }

  get sanitized_url() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.projectsettings.navigation.help_url);
  }
}
