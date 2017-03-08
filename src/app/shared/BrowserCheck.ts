import { BrowserInfo } from "./BrowserInfo";
export class BrowserCheck{
	private platform:BrowserInfo = new BrowserInfo();

	public isValidBrowser(allowed_browsers:any[]):boolean{

		for(let i = 0; i < allowed_browsers.length; i++){
			let browser = allowed_browsers[i];
			if(browser.name === platform.name){
				return true;
			}
		}

		return false;
	}
}