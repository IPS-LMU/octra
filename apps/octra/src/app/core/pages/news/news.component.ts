import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslocoPipe } from '@jsverse/transloco';
import { NavbarService } from '../../component/navbar/navbar.service';
import { SettingsService } from '../../shared/service';

@Component({
  selector: 'octra-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgStyle, TranslocoPipe],
})
export class NewsComponent implements OnInit, OnChanges {
  @Input() url = '';

  public loaded = false;

  constructor(
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    public settService: SettingsService,
    private navService: NavbarService,
  ) {}

  ngOnInit() {
    this.navService.showInterfaces = false;
    this.navService.showExport = false;
  }

  ngOnChanges(obj: SimpleChanges) {
    if (!(obj['url'] === undefined)) {
      this.cd.markForCheck();
      this.cd.checkNoChanges();
    }
  }

  onLoad() {
    this.loaded = true;
  }
}
