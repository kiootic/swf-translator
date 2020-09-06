export function sum(data: number[]): number {
  let sum = 0;
  for (const i of data) {
    sum += i;
  }
  return sum;
}
