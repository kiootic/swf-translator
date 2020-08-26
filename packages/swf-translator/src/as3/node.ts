import { Subtree } from "lezer";

export class Node {
  constructor(readonly sourceText: string, readonly tree: Subtree) {}

  get term(): number {
    return this.tree.type.id;
  }

  get name(): string {
    return this.tree.type.name;
  }

  get text(): string {
    return this.sourceText.slice(this.tree.start, this.tree.end);
  }

  get parent(): Node | null {
    return this.tree.parent && new Node(this.sourceText, this.tree.parent);
  }

  findChildren(term: number): Node[] {
    const children: Node[] = [];
    let child: Subtree | null = this.tree.firstChild;
    while (child) {
      if (child.type.id === term) {
        children.push(new Node(this.sourceText, child));
      }
      child = this.tree.childAfter(child.end + 1);
    }
    return children;
  }

  findChild(term: number): Node | null {
    let child: Subtree | null = this.tree.firstChild;
    while (child) {
      if (child.type.id === term) {
        break;
      }
      child = this.tree.childAfter(child.end + 1);
    }
    return child && new Node(this.sourceText, child);
  }

  findNamedChild(name: string): Node | null {
    let child: Subtree | null = this.tree.firstChild;
    while (child) {
      if (child.type.name === name) {
        break;
      }
      child = this.tree.childAfter(child.end);
    }
    return child && new Node(this.sourceText, child);
  }

  findRecursiveChildren(term: number): Node[] {
    const children: Node[] = [];
    this.tree.iterate({
      enter: (type, start, end) => {
        if (type.id !== term) {
          return;
        }
        let child: Subtree | null = this.tree.resolve(start, 1);
        while (child && child.end !== end) {
          child = child.parent;
        }
        if (child) {
          children.push(new Node(this.sourceText, child));
        }
      },
    });
    return children;
  }
}
