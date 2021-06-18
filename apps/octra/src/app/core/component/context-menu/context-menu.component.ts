import {Component, Input} from '@angular/core';
import {fadeInOnEnterAnimation, fadeOutOnLeaveAnimation} from 'angular-animations';
import {IconProp} from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'octra-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
  animations: [
    fadeInOnEnterAnimation({
      duration: 100
    }),
    fadeOutOnLeaveAnimation({
      duration: 100
    })
  ]
})
export class ContextMenuComponent {
  isVisible = false;

  @Input() x = 0;
  @Input() y = 0;

  @Input() actions: ContextMenuAction[] = [];

  onMouseLeave() {
    this.isVisible = false;
  }

  public showMenu() {
    this.isVisible = true;
  }

  doAction(func: () => void) {
    func();
    this.hide();
  }

  public hide() {
    this.isVisible = false;
  }

  public changeActionStatus(name: string, status: 'active' | 'inactive') {
    const index = this.actions.findIndex(a => a.name === name);

    if (index > -1) {
      this.actions[index].status = status;
    }
  }
}

export interface ContextMenuAction {
  name: string,
  status: 'active' | 'inactive',
  icon: IconProp,
  label: string,
  func: () => void
}
