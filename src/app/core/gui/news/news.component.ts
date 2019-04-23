import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {SettingsService} from '../../shared/service';
import {ProjectSettings} from '../../obj/Settings';
import {NavbarService} from '../navbar/navbar.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsComponent implements OnInit, OnChanges {

  @Input() url;

  public loaded = false;

  public get projectsettings(): ProjectSettings {
    return this.settService.projectsettings;
  }

  get sanitized_url() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.projectsettings.navigation.help_url);
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
    if (!(obj.url === null || obj.url === undefined)) {
      this.cd.markForCheck();
      this.cd.checkNoChanges();
    }
  }

  onLoad() {
    this.loaded = true;
  }
}
