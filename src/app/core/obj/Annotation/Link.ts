import {ILink} from './AnnotJSON';

export class Link implements ILink {
  fromID: number;
  toID: number;

  constructor(fromID: number, toID: number) {
    this.fromID = fromID;
    this.toID = toID;
  }
}
