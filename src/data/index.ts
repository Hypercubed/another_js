export { strings_en, strings_fr, font } from "./strings";

let isDemo = true;
let PARTS = null;
let bitmaps = null;
let sounds = null;
let modules = null;

try {
  const DATA = require("./ootw");
  isDemo = false;

  PARTS = {
    16000: [
      DATA.data14,
      DATA.size14,
      DATA.data15,
      DATA.size15,
      DATA.data16,
      DATA.size16,
      null,
      null,
    ], // protection
    16001: [
      DATA.data17,
      DATA.size17,
      DATA.data18,
      DATA.size18,
      DATA.data19,
      DATA.size19,
      null,
      null,
    ], // introduction
    16002: [
      DATA.data1a,
      DATA.size1a,
      DATA.data1b,
      DATA.size1b,
      DATA.data1c,
      DATA.size1c,
      DATA.data11,
      DATA.size11,
    ], // water
    16003: [
      DATA.data1d,
      DATA.size1d,
      DATA.data1e,
      DATA.size1e,
      DATA.data1f,
      DATA.size1f,
      DATA.data11,
      DATA.size11,
    ], // jail
    16004: [
      DATA.data20,
      DATA.size20,
      DATA.data21,
      DATA.size21,
      DATA.data22,
      DATA.size22,
      DATA.data11,
      DATA.size11,
    ], // city
    16005: [
      DATA.data23,
      DATA.size23,
      DATA.data24,
      DATA.size24,
      DATA.data25,
      DATA.size25,
      DATA.data11,
      DATA.size11,
    ], // arena
    16006: [
      DATA.data26,
      DATA.size26,
      DATA.data27,
      DATA.size27,
      DATA.data28,
      DATA.size28,
      DATA.data11,
      DATA.size11,
    ], // luxury
    16007: [
      DATA.data29,
      DATA.size29,
      DATA.data2a,
      DATA.size2a,
      DATA.data2b,
      DATA.size2b,
      DATA.data11,
      DATA.size11,
    ], // final
    16008: [
      DATA.data7d,
      DATA.size7d,
      DATA.data7e,
      DATA.size7e,
      DATA.data7f,
      DATA.size7f,
      null,
      null,
    ], // password screen
  };

  bitmaps = DATA.bitmaps;
  sounds = DATA.sounds;
  modules = DATA.modules;
} catch (e) {
  const DATA = require("./ootw-demo");

  PARTS = {
    16001: [
      DATA.data17,
      DATA.size17,
      DATA.data18,
      DATA.size18,
      DATA.data19,
      DATA.size19,
      null,
      null,
    ], // introduction
    16002: [
      DATA.data1a,
      DATA.size1a,
      DATA.data1b,
      DATA.size1b,
      DATA.data1c,
      DATA.size1c,
      DATA.data11,
      DATA.size11,
    ], // water
  };

  bitmaps = DATA.bitmaps;
  sounds = DATA.sounds;
  modules = DATA.modules;
}

export { isDemo, PARTS, bitmaps, sounds, modules };
