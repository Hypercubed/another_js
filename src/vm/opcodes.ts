export const enum OP_CODE {
  /* 0x00 */
  movConst,
  mov,
  add,
  addConst,

  /* 0x04 */
  call,
  ret,
  pauseThread,
  jmp,

  /* 0x08 */
  setSetVect,
  jnz,
  condJmp,
  setPalette,

  /* 0x0C */
  resetThread,
  selectVideoPage,
  fillVideoPage,
  copyVideoPage,

  /* 0x10 */
  blitFramebuffer,
  killThread,
  drawString,
  sub,

  /* 0x14 */
  and,
  or,
  shl,
  shr,

  /* 0x18 */
  playSound,
  updateMemList,
  playMusic,
}

export const DRAW_POLY_BACKGROUND = 0x80;
export const DRAW_POLY_SPRITE = 0x40;
