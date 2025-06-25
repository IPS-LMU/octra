import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
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
  private sanitizer = inject(DomSanitizer);
  private cd = inject(ChangeDetectorRef);
  settService = inject(SettingsService);
  private navService = inject(NavbarService);

  @Input() url = '';

  public loaded = false;

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
