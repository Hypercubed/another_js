import { decompressSync } from "fflate";

export { strings_en, strings_fr, font } from "./strings";

type Resource = Record<number, [string, number]>;

interface Data {
  bitmaps: Resource;
  sounds?: Resource;
  modules?: Resource;
}

interface Parts {
  [key: number]: [string, number, string, number, string, number, string, number];
}

let isDemo = true;
let PARTS: Parts = null;
let DATA: Data = null;

try {
  /* @ts-ignore */
  const RES = await import(/* webpackIgnore: true */ "./ootw.js");

  console.log("loaded ootw.js");

  // const RES15 = await import(/* webpackIgnore: true */ "./ootw-15th.js");
  // const RES = RES0;

  isDemo = false;

  PARTS = {
    16000: [
      RES.data14,
      RES.size14,
      RES.data15,
      RES.size15,
      RES.data16,
      RES.size16,
      null,
      null,
    ], // protection
    16001: [
      RES.data17,
      RES.size17,
      RES.data18,
      RES.size18,
      RES.data19,
      RES.size19,
      null,
      null,
    ], // introduction
    16002: [
      RES.data1a,
      RES.size1a,
      RES.data1b,
      RES.size1b,
      RES.data1c,
      RES.size1c,
      RES.data11,
      RES.size11,
    ], // water
    16003: [
      RES.data1d,
      RES.size1d,
      RES.data1e,
      RES.size1e,
      RES.data1f,
      RES.size1f,
      RES.data11,
      RES.size11,
    ], // jail
    16004: [
      RES.data20,
      RES.size20,
      RES.data21,
      RES.size21,
      RES.data22,
      RES.size22,
      RES.data11,
      RES.size11,
    ], // city
    16005: [
      RES.data23,
      RES.size23,
      RES.data24,
      RES.size24,
      RES.data25,
      RES.size25,
      RES.data11,
      RES.size11,
    ], // arena
    16006: [
      RES.data26,
      RES.size26,
      RES.data27,
      RES.size27,
      RES.data28,
      RES.size28,
      RES.data11,
      RES.size11,
    ], // luxury
    16007: [
      RES.data29,
      RES.size29,
      RES.data2a,
      RES.size2a,
      RES.data2b,
      RES.size2b,
      RES.data11,
      RES.size11,
    ], // final
    16008: [
      RES.data7d,
      RES.size7d,
      RES.data7e,
      RES.size7e,
      RES.data7f,
      RES.size7f,
      null,
      null,
    ], // password screen
  };

  DATA = {
    bitmaps: RES.bitmaps as unknown as Resource,
    sounds: RES.sounds as unknown as Resource,
    modules: RES.modules as unknown as Resource,
  };

} catch (e) {
  /* @ts-ignore */
  const RES = await import(/* webpackIgnore: true */ "./ootw-demo.js");

  console.log("loaded ootw-demo.js");

  PARTS = {
    16001: [
      RES.data17,
      RES.size17,
      RES.data18,
      RES.size18,
      RES.data19,
      RES.size19,
      null,
      null,
    ], // introduction
    16002: [
      RES.data1a,
      RES.size1a,
      RES.data1b,
      RES.size1b,
      RES.data1c,
      RES.size1c,
      RES.data11,
      RES.size11,
    ], // water
  };

  DATA = {
    bitmaps: RES.bitmaps as unknown as Resource,
    sounds: RES.sounds as unknown as Resource,
    modules: RES.modules as unknown as Resource,
  };
}

export function load_modules() {
  if (!DATA.modules) return false;

  Object.entries(DATA.modules).forEach(([, module]: any[]) => {
    const [data, size] = module;
    module.push(load(data, size));
  });

  return true;
}

export function load_sounds() {
  if (!DATA.sounds) return false;

  Object.entries(DATA.sounds).forEach(([, sound]: any[]) => {
    const [data, size] = sound;
    sound.push(load(data, size));
  });

  return true;
}

export function load(data: string, size: number) {
  if (!data) return null;

  data = atob(data);
  if (data.length != size) {
    let len = data.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = data.charCodeAt(i);
    }
    let buf = decompressSync(bytes);
    console.assert(buf.length == size);
    return buf;
  }

  let buf = new Uint8Array(size);
  for (let i = 0; i < data.length; ++i) {
    buf[i] = data.charCodeAt(i) & 0xff;
  }
  return buf;
}

export { isDemo, PARTS, DATA };
