export abstract class Converter{
	constructor(){

	}

	abstract convert(data:any, filename:string):any;
}