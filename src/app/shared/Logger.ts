export class Logger{
	public static err(message:string){
		console.error(Logger.getDateStr() + ": " + message);
	}

	public static warn(message:string){
		console.warn(Logger.getDateStr() + ": " + message);
	}

	public static log(message:string){
		console.log(Logger.getDateStr() + ": " + message);
	}

	public static getDateStr() {
		let date = new Date();
		return date.toLocaleDateString()+ " " + date.toLocaleTimeString();
	}

	private entries:any[];
	private group_name:string;

	constructor(groupe_name:string){
		this.entries = [];
		this.group_name = groupe_name;
	}

	public addEntry(type:string, message:string){
		this.entries.push(
			{
				type:type,
				message:message
			}
		);
	}

	public output(){
		console.groupCollapsed(this.group_name);
		for(let i = 0; i < this.entries.length; i++){
			let entry = this.entries[i];

			switch(entry.type){
				case("log"):
					Logger.log(entry.message);
					break;
				case("err"):
					Logger.err(entry.message);
					break;
				case("warn"):
					Logger.warn(entry.message);
					break;
			}
		}
		console.groupEnd();
	}
}