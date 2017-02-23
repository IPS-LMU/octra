export class ConfigValidator{
	public validate(key:string, value:any):ValidationResult{
		return {
			success:false,
			error: "unknown error"
		};
	}

	public validateObject(obj:any):ValidationResult{
		for(let key in obj){
			let result:ValidationResult = this.validate(key, obj["" + key + ""]);
			if(result.success == false)
				return result;
		}

		return {
			success: true,
			error: ""
		}
	}
}

export interface ValidationResult{
	success:boolean;
	error: string
}