import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {SessionStorage, SessionStorageService} from 'ngx-webstorage';
import {BrowserInfo} from '../../shared';
import {Functions} from '@octra/utilities';

@Component({
  selector: 'octra-stresstest',
  templateUrl: './stresstest.component.html',
  styleUrls: ['./stresstest.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionStorageService]
})
export class StresstestComponent implements OnInit, OnDestroy {

  @SessionStorage('stresstest_js_result') lastResult;
  public measured = 0;
  public status = 'init';
  private sampleData: File;
  private arrayBuffer: ArrayBuffer;

  public get measuredString() {
    const size = Functions.getFileSize(this.measured);
    return `${size.size} ${size.label}`;
  }

  public get performance() {
    return {
      heapSizeLimit: Functions.getFileSize((window.performance as any).memory.jsHeapSizeLimit),
      totalHeapSize: Functions.getFileSize((window.performance as any).memory.totalJSHeapSize),
      heapSizeUsed: Functions.getFileSize((window.performance as any).memory.usedJSHeapSize)
    };
  }

  public get lastResultString() {
    const size = Functions.getFileSize(this.lastResult);
    return `${size.size} ${size.label}`;
  }

  public get info(): any {
    return BrowserInfo;
  }

  constructor(private cd: ChangeDetectorRef, private sessionStorage: SessionStorageService) {
  }

  ngOnInit() {
  }

  ngOnDestroy() {
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
    this.readFile().then(() => {
      this.measured = this.sampleData.size - this.arrayBuffer.byteLength;
      this.lastResult = this.measured;
      this.cd.detectChanges();
      this.start();
    }).catch((error) => {
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
          this.sampleData = new File([this.arrayBuffer, reader.result], 'test2');
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
