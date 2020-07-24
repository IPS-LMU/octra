import {OLevel, OLink} from './annotjson';

export interface IIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;
}

export interface IIDBLink {
  id: number;
  link: OLink;
}

export class OIDBLevel implements IIDBLevel {
  id: number;
  level: OLevel;
  sortorder: number;

  constructor(id: number, level: OLevel, sortorder: number) {
    this.id = id;
    this.level = level;
    this.sortorder = sortorder;
  }
}

export class OIDBLink implements IIDBLink {
  id: number;
  link: OLink;

  constructor(id: number, link: OLink) {
    this.id = id;
    this.link = link;
  }
}
