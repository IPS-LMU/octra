import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { HelpModalComponent } from '../../modals/help-modal/help-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';

@Component({
  selector: 'octra-fastbar',
  templateUrl: './taskbar.component.html',
  styleUrls: ['./taskbar.component.scss'],
})
export class FastbarComponent {
  @Input() responsive = false;
  @Input() buttonLabels: any = {
    shortcuts: 'Shortcuts',
    guidelines: 'Guidlines',
    overview: 'Overview',
    help: 'Help',
  };

  @Output() shortcutbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() guidelinesbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() overviewbtnclicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    public appStorage: AppStorageService,
    private modalService: OctraModalService
  ) {}

  openHelpModal() {
    this.modalService.openModal(HelpModalComponent, HelpModalComponent.options);
  }
}
