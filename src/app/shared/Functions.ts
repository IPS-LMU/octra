import { Subscription } from "rxjs";

declare var document: any;
export type FileSize = {
	size: number,
	label: string
}
export class Functions {
	public static scrollTo(y: number, identifier_element: string) {
		jQuery("html, body").scrollTop(y);
	}

	public static buildStr(str: string, replace_arr: any[]) {
		let result: string = str;

		let reg: RegExp = /({[0-9]+})+/g;
		let count = result.match(reg).length;

		if (count == replace_arr.length) {
			for (let i = 0; i < replace_arr.length; i++) {
				let replace_str = (replace_arr[ i ] != null) ? replace_arr[ i ].toString() : "null";

				result = result.replace("{" + i + "}", replace_str);
			}
		}
		else
			throw "buildStr: number of placeholders do not match with array";

		return result;
	}

	public static isNumber(str: string): boolean {
		let res = parseInt(str, 10);
		return isNaN(res) ? false : true;
	}

	public static equalProperties(elem: any, elem2: any) {
		let result = false;

		for (let el in elem) {
			let prop_str = "" + el + "";
			result = true;
			if (!(prop_str in elem2))
				return false;
		}

		return result;
	}

	public static contains(str1: string, str2: string): boolean {
		return str1.indexOf(str2) !== -1;
	}

	public static placeAtEnd(element: HTMLElement) {
		element.focus();
		if (jQuery(element).text() != "") {
			if (typeof window.getSelection !== "undefined"
				&& typeof document.createRange !== "undefined"
			) {
				//get range
				let txtRange = document.createRange();
				txtRange.selectNodeContents(element);
				//set range to end
				txtRange.collapse(false);

				//get selection of the element
				let selection = window.getSelection();
				selection.removeAllRanges();
				//set previous created range to the element
				selection.addRange(txtRange);
			}
			else if (typeof document.body.createTextRange !== "undefined") {
				//fix for IE and older Opera Browsers

				//create range from body
				let txtRange = document.body.createTextRange();
				txtRange.moveToElementText(element);
				//set selection to end
				txtRange.collapse(false);
				txtRange.select();
			}
		}
	}

	public static escapeRegex(regex_str: string) {
		//escape special chars in regex
		return regex_str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	public static getFileSize(bytes: number): FileSize {
		var result: FileSize = {
			size : 0,
			label: "hallo"
		};

		if ((bytes / 1024) < 1) {
			//take bytes
			result.size = bytes;
			result.label = "B";
		}
		else if (bytes / (1024 * 1024) < 1) {
			//take kilobytes
			result.size = bytes / 1024;
			result.label = "KB";
		}
		else if (bytes / (1024 * 1024 * 1024) < 1) {
			//take megabyte
			result.size = bytes / 1024 / 1024;
			result.label = "MB";
		}
		else if (bytes / (1024 * 1024 * 1024 * 1024) < 1) {
			//take gigabytes

			result.size = bytes / 1024 / 1024 / 1024;
			result.label = "GB";
		}

		return result;
	}

	public static escapeHtml(text: string): string {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	public static unEscapeHtml(text: string): string {
		return text
			.replace("&amp;", "&")
			.replace("&lt;", "<")
			.replace("&gt;", ">")
			.replace("&quot;", "\"")
			.replace("&#039;", "'");
	}
}