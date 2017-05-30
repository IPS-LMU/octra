import {AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NgForm} from '@angular/forms';
import {Router} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';

import {SessionService} from '../../service/session.service';
import {TranscriptionService} from '../../service/transcription.service';
import {ModalComponent} from 'ng2-bs3-modal/ng2-bs3-modal';
import {Observable} from 'rxjs/Observable';
import {ComponentCanDeactivate} from '../../guard/login.deactivateguard';
import {APIService} from '../../service/api.service';
import {NavbarService} from '../../service/navbar.service';
import {SubscriptionManager} from '../../shared';
import {TranslateService} from '@ngx-translate/core';
import {SettingsService} from '../../service/settings.service';
import {isNullOrUndefined} from 'util';
import {TextConverter} from '../../shared/Converters/TextConverter';
import {AnnotJSONConverter} from '../../shared/Converters/AnnotJSONConverter';


@Component({
  selector: 'app-transcription-submit',
  templateUrl: './transcription-submit.component.html',
  styleUrls: ['./transcription-submit.component.css']
})
export class TranscriptionSubmitComponent implements OnInit, ComponentCanDeactivate, OnDestroy, AfterViewInit, OnChanges {

  @ViewChild('modal') modal: ModalComponent;
  @ViewChild('modal2') modal2: ModalComponent;
  @ViewChild('fo') form: NgForm;

  private send_ok = false;
  public send_error = '';
  private subscrmanager: SubscriptionManager;

  public feedback_data = {};

  public t = '';

  public test = {
    ok: ''
  };

  constructor(public sessService: SessionService,
              public router: Router,
              public transcrService: TranscriptionService,
              public api: APIService,
              public cd: ChangeDetectorRef,
              public sanitizer: DomSanitizer,
              public navbarServ: NavbarService,
              private langService: TranslateService,
              private settingsService: SettingsService) {
    this.subscrmanager = new SubscriptionManager();

    if (!this.transcrService.annotation.levels[0].segments && this.sessService.annotation.sampleRate) {
      this.transcrService.loadSegments(this.sessService.annotation.sampleRate);
    }

    this.loadForm();

    if (isNullOrUndefined(this.sessService.feedback)) {
      console.error('feedback is null!');
    }

    this.navbarServ.show_interfaces = false;
    this.navbarServ.show_export = false;
  }

  ngOnInit() {
  }

  canDeactivate(): Observable<boolean> | boolean {
    return this.send_ok;
  }

  public back() {
    if (!this.sessService.offline) {
      this.sessService.comment = this.transcrService.feedback.comment;
      this.saveForm();
      this.sessService.save('feedback', this.transcrService.feedback.exportData());
    }

    this.router.navigate(['/user/transcr']);
  }

  onSubmit(form: NgForm) {
    if (!this.sessService.offline) {
      this.sessService.comment = this.transcrService.feedback.comment;
      this.saveForm();
      this.sessService.save('feedback', this.transcrService.feedback.exportData());
    }
    this.modal.open();
  }

  onSendNowClick() {
    this.modal.dismiss();
    this.modal2.open();
    this.send_ok = true;

    const json: any = this.transcrService.exportDataToJSON();

    this.subscrmanager.add(this.api.saveSession(json.transcript, json.project, json.annotator,
      json.jobno, json.id, json.status, json.comment, json.quality, json.log)
      .catch(this.onSendError)
      .subscribe((result) => {
          if (result != null && result.hasOwnProperty('statusText') && result.statusText === 'OK') {
            this.sessService.submitted = true;
            this.modal2.close();
            setTimeout(() => {
              this.router.navigate(['/user/transcr/submitted']);
            }, 1000);
          } else {
            this.send_error = this.langService.instant('send error');
          }
        }
      ));
  }

  ngAfterViewInit() {
    setTimeout(() => {
      jQuery.material.init();
    }, 100);

  }

  onSendError = (error) => {
    this.send_error = error.message;
    return Observable.throw(error);
  }

  ngOnDestroy() {
    this.navbarServ.show_interfaces = this.settingsService.projectsettings.navigation.interfaces;
    this.navbarServ.show_export = this.settingsService.projectsettings.navigation.export;
    this.subscrmanager.destroy();
  }

  ngOnChanges(obj) {
    if (!isNullOrUndefined(obj.form)) {
    }

    jQuery.material.init();
  }

  getURI(format: string): string {
    let result = '';

    switch (format) {
      case('text'):
        result += 'data:text/plain;charset=UTF-8,';
        result += encodeURIComponent(this.transcrService.getTranscriptString(new TextConverter()));
        break;
      case('annotJSON'):
        result += 'data:application/json;charset=UTF-8,';
        result += encodeURIComponent(this.transcrService.getTranscriptString(new AnnotJSONConverter()));
        break;
    }

    return result;
  }

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  changeValue(control: string, value: any) {
    const result = this.transcrService.feedback.setValueForControl(control, value.toString());
  }

  translate(languages: any, lang: string): string {
    if (isNullOrUndefined(languages[lang])) {
      for (const attr in languages) {
        // take first
        if (languages.hasOwnProperty(attr)) {
          return languages[attr];
        }
      }
    }
    return languages[lang];
  }

  private saveForm() {
    for (const control in this.feedback_data) {
      if (this.feedback_data.hasOwnProperty(control)) {
        this.changeValue(control, this.feedback_data[control]);
      }
    }
  }

  private loadForm() {
    // create emty attribute
    if (!isNullOrUndefined(this.settingsService.projectsettings)) {
      const feedback = this.transcrService.feedback;
      console.log("feedback");
      console.log(feedback);
      for (const g in feedback.groups) {
        if (!isNullOrUndefined(g)) {
          for (const c in feedback.groups[g].controls) {
            if (!isNullOrUndefined(c)) {
              const control = feedback.groups[g].controls[c];
              if (control.type.type === 'textarea') {
                this.feedback_data[control.name] = control.value;
              } else {
                // radio or checkbox
                if (!isNullOrUndefined(control.custom)
                  && !isNullOrUndefined(control.custom.checked)
                  && control.custom.checked) {
                  this.feedback_data[control.name] = control.value;
                }
              }
            }
          }
        }
      }
    }
  }
}
