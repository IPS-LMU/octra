import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'timespan',
	pure: false
})
export class TimespanPipe implements PipeTransform {

	private timespan:number = 0;

	transform(value:any, args?:any):any {
		this.timespan = Number(value);
		if(this.timespan < 0) this.timespan = 0;

		let result:string = "";
		let minutes:string = this.FormatNumber(this.Minutes, 2);
		let seconds:string = this.FormatNumber(this.Seconds, 2);
		let miliseconds:string = this.FormatNumber(this.MiliSeconds, 3);

		result += minutes + ":" + seconds + ":" + miliseconds;

		return result;
	}

	private get MiliSeconds():number {
		return (this.timespan % 1000);
	}

	private get Seconds():number {
		return Math.floor(this.timespan/1000)%60;
	}

	private get Minutes():number {
		return Math.floor(this.timespan/1000/60);
	}

	private FormatNumber = (num, length):string => {
		let result = "" + num.toFixed(0);
		while (result.length < length) {
			result = "0" + result;
		}
		return result;
	};

}
