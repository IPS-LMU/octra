import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HelpModalComponent } from '../../modals/help-modal/help-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { ApplicationStoreService } from '../../store/application/application-store.service';

@Component({
  selector: 'octra-fastbar',
  templateUrl: './taskbar.component.html',
  styleUrls: ['./taskbar.component.scss'],
})
export class FastbarComponent {
  @Input() buttonLabels: any = {
    shortcuts: 'Shortcuts',
    guidelines: 'Guidelines',
    overview: 'Overview',
    help: 'Help',
  };

  @Output() shortcutbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() guidelinesbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() overviewbtnclicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    public appStorage: AppStorageService,
    private appStoreService: ApplicationStoreService,
    private modalService: OctraModalService,
  ) {}

  openHelpModal() {
    this.appStoreService.setShortcutsEnabled(false);
    this.modalService
      .openModal(HelpModalComponent, HelpModalComponent.options)
      .then(() => {
        this.appStoreService.setShortcutsEnabled(true);
      })
      .catch(() => {
        this.appStoreService.setShortcutsEnabled(true);
      });
  }
}
