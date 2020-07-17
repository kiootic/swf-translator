export class Reader {
  private buf: Buffer;
  private index = 0;

  private nBits = 0;
  private bits = 0;

  get length(): number {
    return this.buf.length;
  }

  get offset(): number {
    return this.index;
  }

  constructor(buf: Buffer) {
    this.buf = buf;
  }

  flushBits(): void {
    this.nBits = 0;
    this.bits = 0;
  }

  nextBits(nBits: number): number {
    while (this.nBits < nBits) {
      this.bits = (this.bits << 8) | this.buf[this.index++];
      this.nBits += 8;
    }
    const value = this.bits >>> (this.nBits - nBits);
    this.nBits -= nBits;
    this.bits = this.bits & ((1 << this.nBits) - 1);
    return value;
  }

  nextSBits(nBits: number) {
    const s = 32 - nBits;
    return (this.nextBits(nBits) << s) >> s;
  }

  nextBitBool(): boolean {
    return this.nextBits(1) === 1;
  }

  nextUInt8(): number {
    this.flushBits();
    const value = this.buf.readUInt8(this.index);
    this.index += 1;
    return value;
  }

  nextUInt16(): number {
    this.flushBits();
    const value = this.buf.readUInt16LE(this.index);
    this.index += 2;
    return value;
  }

  nextUInt32(): number {
    this.flushBits();
    const value = this.buf.readUInt32LE(this.index);
    this.index += 4;
    return value;
  }

  nextBuffer(length: number): Buffer {
    this.flushBits();
    const value = this.buf.slice(this.index, this.index + length);
    this.index += length;
    return value;
  }

  nextString(): string {
    const begin = this.index;
    const end = this.buf.indexOf(0, begin);
    this.index = end + 1;
    return this.buf.slice(begin, end).toString("utf-8");
  }

  nextFixedString(length: number): string {
    return this.nextBuffer(length).toString("utf-8");
  }
}
