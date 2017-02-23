import { AudioTime } from "./AudioTime";

export class Segment{

	private _transcript = "";

	get transcript():string {
		return this._transcript;
	}

	set transcript(value:string) {
		this._transcript = value;
	}

	constructor(
		public time:AudioTime
	){

	}

	public clone():Segment{
		let seg = new Segment(this.time.clone());
		seg.transcript = this.transcript;
		return seg;
	}

	public toAny():any{
		return {
			transcript: this._transcript,
			time: this.time.toAny()
		}
	}

	public static fromAny(obj:any):Segment{
		if(obj){
			let seg = new Segment(AudioTime.fromAny(obj.time));

			if(obj.transcript)
				seg._transcript = obj.transcript;

			return seg;
		}

		return null;
	}
}