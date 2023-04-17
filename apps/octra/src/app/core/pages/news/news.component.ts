import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SettingsService } from "../../shared/service";
import { NavbarService } from "../../component/navbar/navbar.service";

@Component({
  selector: 'octra-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsComponent implements OnInit, OnChanges {

  @Input() url;

  public loaded = false;

  constructor(private sanitizer: DomSanitizer,
              private cd: ChangeDetectorRef,
              public settService: SettingsService,
              private navService: NavbarService) {
  }

  ngOnInit() {
    this.navService.showInterfaces = false;
    this.navService.showExport = false;
  }

  ngOnChanges(obj) {
    if (!(obj.url === undefined || obj.url === undefined)) {
      this.cd.markForCheck();
      this.cd.checkNoChanges();
    }
  }

  onLoad() {
    this.loaded = true;
  }
}
