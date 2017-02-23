import { Directive, ElementRef, Renderer} from '@angular/core';

@Directive({
  selector: '[audioplayer]',
  exportAs: 'audioplay'
})
export class AudioplayerDirective {

  constructor(private elementRef:ElementRef, private renderer:Renderer) {
  }

  changeStyle(attr:string, val:string){
    this.renderer.setElementStyle(this.elementRef.nativeElement, attr, val);
  }

}
