import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { getBaseHrefURL, joinURL } from '@octra/utilities';
import { DefaultComponent } from '../../component/default.component';
import { OctraModalService } from '../../modals/octra-modal.service';
import { AppStorageService } from '../../shared/service/appstorage.service';
import { IDBService } from '../../shared/service/idb.service';

@Component({
  selector: 'octra-help-tools',
  templateUrl: './help-tools.component.html',
  styleUrls: ['./help-tools.component.scss'],
  imports: [RouterLink],
})
export class HelpToolsComponent extends DefaultComponent {
  private appStorage = inject(AppStorageService);
  private idbService = inject(IDBService);
  private sanitizer = inject(DomSanitizer);
  private modalService = inject(OctraModalService);

  @ViewChild('canvas', { static: false }) canvas!: ElementRef;
  localBackup?: {
    name: string;
    url: SafeResourceUrl;
  };

  backupFiles?: FileList;

  refreshApp() {
    document.location.reload();
  }

  clearAllData() {
    this.appStorage.clearWholeSession().then(() => {
      setTimeout(() => {
        document.location.href = joinURL(getBaseHrefURL(), 'login');
      }, 1000);
    });
  }

  async backupLocalData() {
    const blob = await this.idbService.backup();
    this.localBackup = {
      name: `octra_local_backup_${Date.now()}.json`,
      url: this.sanitizer.bypassSecurityTrustResourceUrl(
        URL.createObjectURL(blob),
      ),
    };
  }

  async importBackup(file: File) {
    try {
      await this.idbService.import(file);
      alert('Import successful. Octra will be reloaded next.');
      document.location.href = joinURL(getBaseHrefURL(), 'login');
    } catch (e: any) {
      this.modalService.openErrorModal(e.message);
    }
  }

  onBackupFilesChange($event: any) {
    this.backupFiles = $event.target!.files;
  }
}
