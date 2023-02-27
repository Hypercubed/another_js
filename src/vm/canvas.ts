let SCALE = 2;
let SCREEN_W = 320 * 2;
let SCREEN_H = 200 * 2;

let _canvas: HTMLCanvasElement;

export function update_screen(
  buffer: Uint8Array,
  palette32: Uint32Array,
  palette_type: number,
  palette_bmp: Uint32Array,
  offset: number,
  is_1991: boolean
) {
  let context = _canvas.getContext("2d");
  let data = context.getImageData(0, 0, SCREEN_W, SCREEN_H);
  let rgba = new Uint32Array(data.data.buffer);
  if (is_1991) {
    let rgba_offset = 0;
    for (let y = 0; y < SCREEN_H; y += SCALE) {
      for (let x = 0; x < SCREEN_W; x += SCALE) {
        const color = palette32[palette_type * 16 + buffer[offset + x]];
        for (let j = 0; j < SCALE; ++j) {
          rgba.fill(
            color,
            rgba_offset + j * SCREEN_W + x,
            rgba_offset + j * SCREEN_W + x + SCALE
          );
        }
      }
      rgba_offset += SCREEN_W * SCALE;
      offset += SCREEN_W * SCALE;
    }
  } else {
    for (let i = 0; i < SCREEN_W * SCREEN_H; ++i) {
      const color = buffer[offset + i];
      if (color < 16) {
        rgba[i] = palette32[palette_type * 16 + color];
      } else {
        rgba[i] = palette_bmp[color - 16];
      }
    }
  }
  context.putImageData(data, 0, 0);
}

export function init_canvas(canvas: HTMLCanvasElement, W: number, H: number, S: number) {
  _canvas = canvas;

  SCALE = S;
  SCREEN_W = W;
  SCREEN_H = H;
}

const _enterFullscreen = (elem: any, options?: any) => {
  return elem[
    [
      "requestFullscreen",
      "mozRequestFullScreen",
      "msRequestFullscreen",
      "webkitRequestFullscreen",
    ].find((prop) => typeof elem[prop] === "function")
  ]?.(options);
};

export function enterFullscreen() {
  _enterFullscreen(_canvas);
}
