export const enum VAR {
  RANDOM_SEED = 0x3c,
  LAST_KEYCHAR = 0xda,
  HERO_POS_UP_DOWN = 0xe5,
  SCROLL_Y = 0xf9,
  HERO_ACTION = 0xfa,
  HERO_POS_JUMP_DOWN = 0xfb,
  HERO_POS_LEFT_RIGHT = 0xfc,
  HERO_POS_MASK = 0xfd,
  HERO_ACTION_POS_MASK = 0xfe,
  PAUSE_SLICES = 0xff,
  MUSIC_SYNC = 0xf4,
  WTF = 0xf7
}

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
  playMusic
}

export const DRAW_POLY_BACKGROUND = 0x80;
export const DRAW_POLY_SPRITE = 0x40;