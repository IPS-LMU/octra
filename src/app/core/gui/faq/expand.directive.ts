import {Directive, ElementRef, HostListener, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[appExpand]'
})
export class ExpandDirective implements OnInit {

  private toggled = true;

  @HostListener('mousedown')
  mouseover() {
    if (this.elRef.nativeElement.tagName !== 'A') {
      let element: Node = this.renderer.parentNode(this.elRef.nativeElement);
      element = this.renderer.parentNode(element);

      const td: Node = element.childNodes[3].childNodes[2];
      this.toogle(td);
    } else {
      const element: Node = this.renderer.parentNode(this.elRef.nativeElement);

      const td: Node = element.nextSibling.nextSibling;
      this.toogle(td);
    }
  }

  constructor(private elRef: ElementRef, private renderer: Renderer2) {

  }

  ngOnInit() {
    if (this.elRef.nativeElement.tagName !== 'A') {
      this.renderer.addClass(this.elRef.nativeElement, 'glyphicon-chevron-up');
    }
  }

  private toogle(node: Node) {
    if (this.toggled) {
      this.renderer.setStyle(node, 'display', 'inherit');
      if (this.elRef.nativeElement.tagName !== 'A') {
        this.renderer.removeClass(this.elRef.nativeElement, 'glyphicon-chevron-up');
        this.renderer.addClass(this.elRef.nativeElement, 'glyphicon-chevron-down');
      }
    } else {
      this.renderer.setStyle(node, 'display', 'none');
      if (this.elRef.nativeElement.tagName !== 'A') {
        this.renderer.removeClass(this.elRef.nativeElement, 'glyphicon-chevron-down');
        this.renderer.addClass(this.elRef.nativeElement, 'glyphicon-chevron-up');
      }
    }
    this.toggled = !this.toggled;
  }

}
