export interface ClockApi {
  now(): number;
  advance(ms: number): void;
  reset(): void;
  readonly offsetMs: number;
}

let offsetMs = 0;

export const clock: ClockApi = {
  now(): number {
    return Date.now() + offsetMs;
  },
  advance(ms: number): void {
    offsetMs += ms;
  },
  reset(): void {
    offsetMs = 0;
  },
  get offsetMs(): number {
    return offsetMs;
  },
};
