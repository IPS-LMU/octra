import { Control } from "./Control";

export class Group {
	public get title():string{
		return this._title;
	}

	public get controls():Control[]{
		return this._controls;
	}

	constructor(private _title: string, private _controls:Control[]){
	}

	public toAny():any{
		let result = {
			title: this._title
		};

		result["controls"] = [];
		for(let i = 0; i < this._controls.length; i++){
			let control = this._controls[i];
			result["controls"].push(control.toAny());
		}

		return result;
	}

	public static fromAny(group:any):Group{
		let controls:Control[] = [];

		for(let i = 0; i < group.controls.length; i++){
			let control = group.controls[i];
			controls.push(Control.fromAny(control));
		}

		return new Group(
			group.title,
			controls
		);
	}
}