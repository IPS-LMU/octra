import {
  Trans14Episode,
  Trans14Event,
  Trans14Root,
  Trans14Section,
  Trans14Speaker,
  Trans14Sync,
  Trans14Topic,
  Trans14Turn,
  Trans14Who
} from './types';

export class XMLNode {
  private static idCounter = 1;
  private id: number;

  tagName: string;
  attributes: any;
  nodeValue: string;
  nodeChildren: XMLNode[] = [];
  parent: XMLNode;
  level = 0;

  constructor(tagName: string) {
    this.id = XMLNode.idCounter++;
    this.tagName = tagName;
  }

  appendChild(node: XMLNode) {
    node.parent = this;
    node.level = this.level + 1;
    this.nodeChildren.push(node);
  }

  public toString() {
    const closingBackSlash = this.nodeValue === '' || this.nodeChildren.length === 0 ? ' /' : '';
    const closingTag = this.nodeValue === '' || this.nodeChildren.length === 0 ? '' : `</${this.tagName}>`;
    let tabs = '';
    for (let i = 0; i < this.level; i++) {
      tabs += '\t';
    }

    let attrString = '';
    if (this.attributes) {
      for (const attr of Object.keys(this.attributes)) {
        let attrValue = ` ${attr}`;

        if (this.attributes[attr]) {
          attrValue += `="${this.attributes[attr]}"`;
        }
        attrString += attrValue;
      }
    }

    let result = `\n${tabs}<${this.tagName}${attrString}${closingBackSlash}>`;

    if (this.nodeChildren.length > 0) {
      for (const nodeChild of this.nodeChildren) {
        result += nodeChild.toString();
      }
    }

    if (closingTag !== '') {
      result += `${tabs}${closingTag}`;
    }

    if (this.parent) {
      const index = this.parent.nodeChildren.findIndex(a => a.id === this.id);

      if (index === this.parent.nodeChildren.length - 1) {
        // this node is last child of parent
        result += `\n`;
      }
    }

    return result;
  }
}

export class XMLTransTextNode extends XMLNode {
  constructor(text: string) {
    super(undefined);
    this.nodeValue = text;
  }

  public toString(): string {
    if (this.nodeValue && this.nodeValue !== '') {
      let tabs = '';
      for (let i = 0; i < this.level; i++) {
        tabs += '\t';
      }
      return `\n${tabs}${this.escapeString(this.nodeValue)}`;
    }
    return '\n';
  }

  private escapeString(text: string) {
    return text.replace(/(["'&<>])/g, (match: string, g1: string) => {
      switch (g1) {
        case '"':
          return '&quot;';
        case '\'':
          return '&apos;';
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
      }
      return g1;
    });
  }
}

export class XMLTransNode extends XMLNode {
  attributes: Trans14Root;

  constructor(attributes?: Partial<Trans14Root>) {
    super('Trans');
    this.attributes = attributes;
  }
}

export class XMLTransTopicsNode extends XMLNode {
  constructor() {
    super('Topics');
  }
}

export class XMLTransTopicNode extends XMLNode {
  attributes: Trans14Topic;

  constructor(attributes?: Trans14Topic) {
    super('Topic');
    this.attributes = attributes;
  }
}

export class XMLTransSpeakersNode extends XMLNode {
  constructor() {
    super('Speakers');
  }
}

export class XMLTransSpeakerNode extends XMLNode {
  attributes: Trans14Speaker;

  constructor(attributes?: Trans14Speaker) {
    super('Speaker');
    this.attributes = attributes;
  }
}

export class XMLTransEpisodeNode extends XMLNode {
  attributes: Trans14Episode;

  constructor(attributes?: Trans14Episode) {
    super('Episode');
    this.attributes = attributes;
  }
}

export class XMLTransSectionNode extends XMLNode {
  attributes: Trans14Section;

  constructor(attributes?: Trans14Section) {
    super('Section');
    this.attributes = attributes;
  }
}

export class XMLTransTurnNode extends XMLNode {
  attributes: Trans14Turn;

  constructor(attributes?: Trans14Turn) {
    super('Turn');
    this.attributes = attributes;
  }
}

export class XMLTransSyncNode extends XMLNode {
  attributes: Trans14Sync;

  constructor(attributes?: Trans14Sync) {
    super('Sync');
    this.attributes = attributes;
  }
}

export class XMLTransWhoNode extends XMLNode {
  attributes: Trans14Who;

  constructor(attributes?: Trans14Who) {
    super('Who');
    this.attributes = attributes;
  }
}

export class XMLTransEventNode extends XMLNode {
  attributes: Trans14Event;

  constructor(attributes?: Trans14Event) {
    super('Event');
    this.attributes = attributes;
  }
}

export class Trans14XMLDocument {
  xmlTag = {
    version: '1.0',
    encoding: 'UTF-8'
  };

  trans: XMLTransNode = new XMLTransNode();

  constructor() {
  }

  public toString(): string {
    return `<?xml version="${this.xmlTag.version}" encoding="${this.xmlTag.encoding}" ?>
<!DOCTYPE Trans SYSTEM "trans-14.dtd">${this.trans.toString()}`;
  }
}
