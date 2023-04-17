import { APIData } from "./APIData";

export class APIResponse {
  private systemstate: string;
  private type: string;
  private data: any;
  private message: string;

  constructor(systemstate: string,
              type: string,
              data: APIData,
              message: string) {
    this.systemstate = systemstate;
    this.type = type;
    this.data = data;
    this.message = message;
  }
}
