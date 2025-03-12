import { NgClass } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { SubscriberComponent } from '@octra/ngx-utilities';

export class PreparedItem {
  constructor(
    public value: any,
    public selected = false,
  ) {}
}

@Component({
  selector: 'octra-toolconfig-array-adder',
  templateUrl: './toolconfig-array-adder.component.html',
  styleUrls: ['./toolconfig-array-adder.component.scss'],
  imports: [FormsModule, NgbPopover, NgClass],
})
export class ToolConfigArrayAdderComponent extends SubscriberComponent {
  @Input() items: any[] = [];
  @Input() uniqueItems = false;
  @Input() values: any[] = [];
  @Output() itemsAdd = new EventEmitter<any[]>();
  @Input() type?: 'text' | 'number' | 'integer';
  @Input() disabled = false;

  @ViewChild('p') popover!: NgbPopover;
  inputValue: any;

  protected _items: PreparedItem[] = [];

  add() {
    if (!this.inputValue) {
      this.itemsAdd.emit(
        this._items.filter((a) => a.selected).map((a) => a.value),
      );
    } else {
      this.itemsAdd.emit([this.inputValue]);
      this.inputValue = undefined;
    }
  }

  open() {
    if (!this.disabled) {
      this._items = this.items?.map((a: any) => new PreparedItem(a));
      this.popover.open();
    }
  }
}
