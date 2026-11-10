/** Shuffles the supplied array in place using Fisher–Yates. */
export function shuffle<T>(values: T[]): void {
  for (let index = values.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }
}
