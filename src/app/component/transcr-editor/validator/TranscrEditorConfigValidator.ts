import { ConfigValidator, ValidationResult } from "../../../shared/ConfigValidator";
import { isArray } from "util";

export class TranscrEditorConfigValidator extends ConfigValidator {

	public validate(key: string, value: any): ValidationResult {
		let prefix: string = "TranscrEditorConfig Validation - ";

		switch (key) {
			case("height"):
				if (typeof value === "number" && value > 0) break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type number greater 0"
				};
			case("disabled_keys"):
				let val_ok = true;
				if (isArray(value)){
					//check types
					for(let i = 0; i < value.length; i++){
						if(typeof value[i] !== "string"){
							val_ok = false;
							break;
						}
					}
					if(val_ok) break;
				}
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type number greater 0"
				};
			case("responsive"):
				if (typeof value === "boolean") break;
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type boolean"
				};
			case("markers"):
				let val_ok2 = true;
				if (isArray(value)) {
					for (let i = 0; i < value.length; i++) {
						let marker = value[i];

						if(typeof marker !== "object" ||
							!marker.hasOwnProperty("name") ||typeof marker.name !== "string" ||
							!marker.hasOwnProperty("code") ||typeof marker.code !== "string" ||
							!marker.hasOwnProperty("icon_url") ||typeof marker.icon_url !== "string" ||
							!marker.hasOwnProperty("button_text") ||typeof marker.button_text !== "string" ||
							!marker.hasOwnProperty("description") ||typeof marker.description !== "string" ||
							!marker.hasOwnProperty("shortcut") || typeof marker.shortcut !== "object" ||
							!marker.shortcut.hasOwnProperty("mac") || typeof marker.shortcut.mac !== "string" ||
							!marker.shortcut.hasOwnProperty("pc") || typeof marker.shortcut.pc !== "string"
						){
							val_ok2 = false;
							break;
						}
					}
					if(val_ok2) break;
				}
				return {
					success: false,
					error  : prefix + "value of key '" + key + "' must be of type array. Compare your config with default config to find the solution."
				};
			default:
				return {
					success: false,
					error  : prefix + "key '" + key + "' not found"
				};
		}

		return {
			success: true,
			error  : ""
		};
	}
}