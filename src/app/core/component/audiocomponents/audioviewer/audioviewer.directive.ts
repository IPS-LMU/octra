import {Directive, ElementRef, Renderer2} from '@angular/core';

@Directive({
  selector: '[appAudioviewer]',
  exportAs: 'audioview'
})
export class AudioviewerDirective {

  constructor(private elementRef: ElementRef, private renderer: Renderer2) {
  }

  changeStyle(attr: string, val: string) {
    this.renderer.setStyle(this.elementRef.nativeElement, attr, val);
  }

  changeAttr(attr: string, val: string) {
    this.renderer.setAttribute(this.elementRef.nativeElement, attr, val);
  }
}
