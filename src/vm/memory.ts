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
  WTF = 0xf7,
  HACK_VAR_54 = 0x54,
  HACK_VAR_67 = 0x67,
  HACK_VAR_DC = 0xdc,
  HACK_VAR_F7 = 0xf7,
  HACK_VAR_BC = 0xbc,
  HACK_VAR_F2 = 0xf2,
  HACK_VAR_C6 = 0xc6,
  HACK_VAR_E4 = 0xe4,
}

export interface TaskState {
  state: number;
  next_state: number;
  offset: number;
  next_offset: number;
  stack: number[];
}

export const vmVars: number[] = new Array(256);
export const vmTasks: TaskState[] = new Array(64);
