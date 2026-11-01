declare module "flubber" {
  type Ring = [number, number][];
  type Shape = string | Ring;
  interface Options {
    maxSegmentLength?: number;
    string?: boolean;
    single?: boolean;
  }
  export function interpolate(from: Shape, to: Shape, options?: Options): (t: number) => string;
  export function toCircle(from: Shape, x: number, y: number, r: number, options?: Options): (t: number) => string;
  export function fromCircle(x: number, y: number, r: number, to: Shape, options?: Options): (t: number) => string;
}
