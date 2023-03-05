import { SCALE, SCREEN_H, SCREEN_W } from './constants';
import * as palette from './palette';

let is_1991 = false;

let _canvas: HTMLCanvasElement;

let image: any = null;

// function readImage() {
//   const _image = new Image();
//   _image.onload = function() {
//     image = _image;
//   };

//   _image.src = ""
// }

// readImage();

export function update(buffer: Uint8Array, offset: number) {
  const context = _canvas.getContext('2d')!;
  const data = context.getImageData(0, 0, SCREEN_W, SCREEN_H);
  const rgba = new Uint32Array(data.data.buffer);

  if (is_1991) {
    let rgba_offset = 0;
    for (let y = 0; y < SCREEN_H; y += SCALE) {
      for (let x = 0; x < SCREEN_W; x += SCALE) {
        const color =
          palette.palette32[palette.palette_type * 16 + buffer[offset + x]];
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
      if (image && color === 16) {
        continue;
      }

      if (color < 16) {
        rgba[i] = palette.palette32[palette.palette_type * 16 + color];
      } else {
        rgba[i] = palette.palette_bmp[color - 16];
      }
    }
  }

  context.putImageData(data, 0, 0);
}

export function init(
  canvas: HTMLCanvasElement
) {
  _canvas = canvas;
}

export function set_resolution(low: boolean) {
  is_1991 = low;
}

export function toggle_resolution() {
  is_1991 = !is_1991;
}
