import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { AppInfo } from '../../../app.info';
import { ASRLanguage, ASRSettings } from '../../obj/Settings';
import { AlertService } from '../../shared/service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { NgbDropdown, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { DefaultComponent } from '../default.component';
import { AsrStoreService } from '../../store/asr/asr-store-service.service';
import { ASRQueueItemType } from '../../store/asr';
import { OctraAnnotationSegmentLevel, Segment } from '@octra/annotation';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';
import { AudioChunk } from '@octra/web-media';

@Component({
  selector: 'octra-asr-options',
  templateUrl: './asr-options.component.html',
  styleUrls: ['./asr-options.component.scss'],
})
export class AsrOptionsComponent extends DefaultComponent implements OnInit {
  public serviceProviders: any = {};
  public settings = {
    onlyForThisOne: false,
    allSegmentsNext: false,
  };

  @Input() asrSettings!: ASRSettings;
  @Input() audioChunk?: AudioChunk;
  @Input() enabled = true;
  @ViewChild('dropdown', { static: true }) dropdown!: NgbDropdown;
  @ViewChild('dropdown2', { static: true }) dropdown2!: NgbDropdown;
  @ViewChild('pop', { static: true }) pop!: NgbPopover;

  public get manualURL(): string {
    return AppInfo.manualURL;
  }

  constructor(
    public appStorage: AppStorageService,
    public asrStoreService: AsrStoreService,
    private annotationStoreService: AnnotationStoreService,
    private alertService: AlertService,
    private langService: TranslocoService
  ) {
    super();
  }

  ngOnInit() {
    for (const provider of this.asrSettings.services) {
      this.serviceProviders['' + provider.provider] = provider;
    }
  }

  getShortCode(code: string) {
    return code.substring(code.length - 2);
  }

  onMouseMove() {}

  onMouseOut() {}

  onASRLangChanged(lang?: ASRLanguage) {
    this.asrStoreService.changeASRService(lang);
    this.dropdown.close();
  }

  startASRForThisSegment() {
    if (this.asrStoreService.asrOptions?.selectedLanguage !== undefined) {
      if (this.audioChunk!.time.duration.seconds > 600) {
        // trigger alert, too big audio duration
        this.alertService
          .showAlert(
            'danger',
            this.langService.translate('asr.file too big').toString()
          )
          .catch((error) => {
            console.error(error);
          });
      } else {
        if (
          this.annotationStoreService.currentLevel instanceof
          OctraAnnotationSegmentLevel
        ) {
          const time = this.audioChunk!.time.start.add(
            this.audioChunk!.time.duration
          );
          const segNumber =
            this.annotationStoreService.transcript!.getCurrentSegmentIndexBySamplePosition(
              time
            );

          if (segNumber > -1) {
            const segment = this.annotationStoreService.currentLevel!.items[
              segNumber
            ] as Segment;

            if (segment !== undefined) {
              this.asrStoreService.addToQueue(
                {
                  sampleStart: this.audioChunk!.time.start.samples,
                  sampleLength: this.audioChunk!.time.duration.samples,
                },
                ASRQueueItemType.ASR
              );
              this.asrStoreService.startProcessing();
            } else {
              console.error(`could not find segment for doing ASR.`);
            }
          } else {
            console.error(
              `could not start ASR because segment number was not found.`
            );
          }
        }
      }
    }
  }

  startASRForAllSegmentsNext() {
    const segNumber =
      this.annotationStoreService.transcript!.getCurrentSegmentIndexBySamplePosition(
        this.audioChunk!.time.start.add(this.audioChunk!.time.duration)
      );

    if (
      segNumber > -1 &&
      this.annotationStoreService.transcript?.currentLevel &&
      this.annotationStoreService.transcript?.currentLevel instanceof
        OctraAnnotationSegmentLevel
    ) {
      for (
        let i = segNumber;
        i < this.annotationStoreService.transcript.currentLevel.items.length;
        i++
      ) {
        const segment =
          this.annotationStoreService.transcript.currentLevel.items[i];

        if (segment !== undefined) {
          const sampleStart =
            i > 0
              ? this.annotationStoreService.transcript.currentLevel.items[
                  i - 1
                ]!.time.samples
              : 0;
          const sampleLength = segment.time.samples - sampleStart;

          if (
            sampleLength /
              this.audioChunk?.audioManager!.resource!.info!.sampleRate! >
            600
          ) {
            this.alertService
              .showAlert(
                'danger',
                this.langService.translate('asr.file too big')
              )
              .catch((error) => {
                console.error(error);
              });
            this.asrStoreService.stopItemProcessing({
              sampleStart,
              sampleLength,
            });
          } else {
            if (
              segment.getFirstLabelWithoutName('Speaker')?.value &&
              segment.getFirstLabelWithoutName('Speaker')!.value.trim() ===
                '' &&
              this.annotationStoreService.breakMarker?.code !== undefined &&
              segment
                .getFirstLabelWithoutName('Speaker')!
                .value.indexOf(this.annotationStoreService.breakMarker.code) < 0
            ) {
              // segment is empty and contains not a break
              this.asrStoreService.addToQueue(
                {
                  sampleStart,
                  sampleLength,
                },
                ASRQueueItemType.ASR
              );
            }
          }
        } else {
          console.error(
            `could not find segment in startASRForAllSegmentsNext()`
          );
        }
      }
      // this.asrService.startASR();
    } else {
      console.error(
        `could not start ASR for all next because segment number was not found.`
      );
    }
  }

  stopASRForAll() {
    this.asrStoreService.stopProcessing();
  }

  stopASRForThisSegment() {
    this.asrStoreService.stopItemProcessing({
      sampleStart: this.audioChunk!.time.start.samples,
      sampleLength: this.audioChunk!.time.duration.samples,
    });
  }

  onMAUSLangChanged(language: string, code: string) {
    this.asrStoreService.changeASRSelectedMausLanguage(code);
    this.dropdown2.close();
  }

  getQuotaPercentage(langAsr: string) {
    if (this.serviceProviders[langAsr]) {
      const ohService: any = this.serviceProviders[langAsr];
      if (ohService.usedQuota && ohService.quotaPerMonth) {
        return Math.round(
          (ohService.usedQuota / ohService.quotaPerMonth) * 100
        );
      }
    }
    return 0;
  }

  getQuotaLabel(langAsr: string) {
    if (this.serviceProviders[langAsr]) {
      const ohService = this.serviceProviders[langAsr];
      if (ohService.usedQuota && ohService.quotaPerMonth) {
        const remainingQuota =
          (ohService.quotaPerMonth - ohService.usedQuota) / 60;
        let label = '';
        if (remainingQuota > 60) {
          label = `${Math.round(remainingQuota / 60)} hours`;
        } else {
          label = `${Math.round(remainingQuota)} minutes`;
        }

        return `Free quota: Approx.<br/><b>${label}</b><br/>of recording time shared among all BAS users.`;
      } else {
        return `Unlimited quota`;
      }
    }
    return '';
  }
}
