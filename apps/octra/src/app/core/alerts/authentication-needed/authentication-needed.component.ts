import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';

@Component({
  selector: 'octra-authentication-needed',
  templateUrl: './authentication-needed.component.html',
  styleUrls: ['./authentication-needed.component.scss']
})
export class AuthenticationNeededComponent implements OnInit, OnDestroy {
  public static componentName = 'AuthenticationNeededComponent';

  @Output() authenticateClick = new EventEmitter<void>();
  @Output() confirmationClick = new EventEmitter<void>();

  public initialized = new EventEmitter<void>();
  public destroyed = new EventEmitter<void>();
  public clickedOnAuthenticate = false;

  ngOnInit() {
    this.initialized.emit();
  }

  public onAuthenticateClick() {
    this.authenticateClick.emit();
    this.clickedOnAuthenticate = true;
  }

  public onConfirmationClick() {
    this.confirmationClick.emit();
  }

  public ngOnDestroy(): void {
    this.destroyed.emit();
  }
}
