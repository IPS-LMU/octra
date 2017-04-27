import {Injectable, EventEmitter, Component} from '@angular/core';

@Injectable()
export class NavbarService {
    get interfaces(): string[] {
        return this._interfaces;
    }

    set interfaces(value: string[]) {
        this._interfaces = value;
    }

    get show_interfaces(): boolean {
        return this._show_interfaces;
    }

    set show_interfaces(value: boolean) {
        this._show_interfaces = value;
    }

    get show_export(): boolean {
        return this._show_export;
    }

    set show_export(value: boolean) {
        this._show_export = value;
    }

    public onexportbuttonclick = new EventEmitter<any>();

    private _show_export: boolean = false;
    private _show_interfaces: boolean = false;
    private _interfaces: string[] = [];

    public dataloaded:boolean = false;

    public exportformats: any = {
        filename: "",
        text: "",
        annotJSON: ""
    };

    constructor() {
    }

    onExportButtonClick(format: string) {
        this.onexportbuttonclick.emit({
            format: format
        });
    }
}
