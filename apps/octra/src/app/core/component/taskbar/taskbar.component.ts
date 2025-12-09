import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { HelpModalComponent } from '../../modals/help-modal/help-modal.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { ApplicationStoreService } from '../../store/application/application-store.service';
import { RoutingService } from '../../shared/service/routing.service';
import { AnnotationStoreService } from '../../store/login-mode/annotation/annotation.store.service';

@Component({
  selector: 'octra-fastbar',
  templateUrl: './taskbar.component.html',
  styleUrls: ['./taskbar.component.scss'],
})
export class FastbarComponent {
  appStorage = inject(AppStorageService);
  private appStoreService = inject(ApplicationStoreService);
  private modalService = inject(OctraModalService);
  protected routingService = inject(RoutingService);
  protected annotationStoreService = inject(AnnotationStoreService);

  @Input() buttonLabels: any = {
    shortcuts: 'Shortcuts',
    guidelines: 'Guidelines',
    overview: 'Overview',
    help: 'Help',
  };

  @Output() shortcutbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() guidelinesbtnclicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() overviewbtnclicked: EventEmitter<void> = new EventEmitter<void>();

  openHelpModal() {
    this.annotationStoreService.openHelpModal();
  }
}
