import {AfterViewChecked, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'octra-validation-popover',
  templateUrl: './validation-popover.component.html',
  styleUrls: ['./validation-popover.component.css']
})
export class ValidationPopoverComponent implements OnInit, AfterViewChecked {
  @ViewChild('validationContainer', {static: true}) validationContainer: ElementRef;
  public visible = false;

  public get sanitizedDescription(): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, this._description);
  }

  get width(): number {
    return this.validationContainer.nativeElement.offsetWidth;
  }

  private _title = '';

  public get title(): string {
    return this._title;
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public set title(value: string) {
    this._title = value;
  }

  public _description = '';

  public get description(): string {
    return this._description;
  }

  public set description(value: string) {
    this._description = value;
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public get height() {
    return this.validationContainer.nativeElement.offsetHeight;
  }

  constructor(private el: ElementRef, private cd: ChangeDetectorRef, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {
  }

  ngAfterViewChecked(): void {
  }

  public show() {
    if (!this.visible) {
      this.el.nativeElement.style.display = 'flex';
    }
    this.visible = true;
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  public hide() {
    if (this.visible) {
      this.el.nativeElement.style.display = 'none';
    }
    this.visible = false;
    this.cd.markForCheck();
    this.cd.detectChanges();
  }

  @HostListener('mouseleave')
  public onMouseLeave() {
    this.visible = false;
    this.el.nativeElement.style.display = 'none';
  }
}
