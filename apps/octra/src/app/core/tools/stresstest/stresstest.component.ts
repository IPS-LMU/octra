import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { getFileSize } from '@octra/utilities';
import { BrowserInfo } from '@octra/web-media';
import { SessionStorage, SessionStorageService } from 'ngx-webstorage';

@Component({
  selector: 'octra-stresstest',
  templateUrl: './stresstest.component.html',
  styleUrls: ['./stresstest.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionStorageService],
})
export class StresstestComponent {
  private cd = inject(ChangeDetectorRef);
  private sessionStorage = inject(SessionStorageService);

  @SessionStorage('stresstest_js_result') lastResult: any;
  public measured = 0;
  public status = 'init';
  private sampleData!: File;
  private arrayBuffer!: ArrayBuffer;

  public get measuredString() {
    const size = getFileSize(this.measured);
    return `${size.size} ${size.label}`;
  }

  public get performance() {
    return {
      heapSizeLimit: getFileSize(
        (window.performance as any).memory.jsHeapSizeLimit,
      ),
      totalHeapSize: getFileSize(
        (window.performance as any).memory.totalJSHeapSize,
      ),
      heapSizeUsed: getFileSize(
        (window.performance as any).memory.usedJSHeapSize,
      ),
    };
  }

  public get lastResultString() {
    const size = getFileSize(this.lastResult);
    return `${size.size} ${size.label}`;
  }

  public get info(): any {
    return BrowserInfo;
  }

  public getSampleData(mb: number) {
    const array: ArrayBuffer = new ArrayBuffer(1024 * 1024 * mb);
    this.arrayBuffer = array.slice(0);

    return new File([array], 'test');
  }

  public doStresstest() {
    this.sampleData = this.getSampleData(100);
    this.start();
  }

  public start() {
    this.status = 'running';
    this.readFile()
      .then(() => {
        this.measured = this.sampleData.size - this.arrayBuffer.byteLength;
        this.lastResult = this.measured;
        this.cd.detectChanges();
        this.start();
      })
      .catch((error) => {
        this.cd.detectChanges();
        alert('The browser reached its memory limit.');
        console.error(error);
      });
  }

  private readFile(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onloadend = () => {
          this.sampleData = new File(
            [this.arrayBuffer, reader.result!],
            'test2',
          );
          resolve();
        };

        reader.onerror = (err) => {
          this.status = 'init';
          reject(err);
        };

        reader.readAsArrayBuffer(this.sampleData);
      } catch (e) {
        this.status = 'init';
        reject(e);
      }
    });
  }
}
