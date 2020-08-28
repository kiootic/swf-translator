import { Subtree, NodeType, NodeProp } from "lezer";

export class Node {
  readonly children: Node[] = [];

  constructor(
    readonly parent: Node | null,
    readonly text: string,
    readonly start: number,
    readonly end: number,
    readonly type: NodeType
  ) {}

  get term(): number {
    return this.type.id;
  }

  get name(): string {
    return this.type.name;
  }

  static fromTree(text: string, tree: Subtree): Node {
    let root: Node | null = null;
    const stack: Node[] = [];

    tree.iterate({
      enter: (type, start, end) => {
        const parent = stack[stack.length - 1] ?? null;
        const node = new Node(parent, text.slice(start, end), start, end, type);
        if (parent) {
          parent.children.push(node);
        } else {
          root = node;
        }
        stack.push(node);
      },
      leave: (type, start, end) => {
        stack.pop();
      },
    });
    if (!root) {
      throw new Error("No root node constructed");
    }
    return root;
  }

  toString(): string {
    let text: string;
    if (!/\W/.test(this.type.name) || this.type.prop(NodeProp.error)) {
      text = this.type.name;
    } else {
      text = JSON.stringify(this.type.name);
    }
    if (this.children.length > 0) {
      text += `(${this.children.join()})`;
    }
    return text;
  }

  findChildren(term: number): Node[] {
    return this.children.filter((n) => n.type.id === term);
  }

  findChild(term: number): Node | null {
    return this.children.find((n) => n.type.id === term) ?? null;
  }

  findNamedChild(name: string): Node | null {
    return this.children.find((n) => n.type.name === name) ?? null;
  }
}
