export class Keyboard {
  static NUMBER_0: number = 48;
  static NUMBER_1: number = 49;
  static NUMBER_2: number = 50;
  static NUMBER_3: number = 51;
  static NUMBER_4: number = 52;
  static NUMBER_5: number = 53;
  static NUMBER_6: number = 54;
  static NUMBER_7: number = 55;
  static NUMBER_8: number = 56;
  static NUMBER_9: number = 57;
  static A: number = 65;
  static B: number = 66;
  static C: number = 67;
  static D: number = 68;
  static E: number = 69;
  static F: number = 70;
  static G: number = 71;
  static H: number = 72;
  static I: number = 73;
  static J: number = 74;
  static K: number = 75;
  static L: number = 76;
  static M: number = 77;
  static N: number = 78;
  static O: number = 79;
  static P: number = 80;
  static Q: number = 81;
  static R: number = 82;
  static S: number = 83;
  static T: number = 84;
  static U: number = 85;
  static V: number = 86;
  static W: number = 87;
  static X: number = 88;
  static Y: number = 89;
  static Z: number = 90;
  static SEMICOLON: number = 186;
  static EQUAL: number = 187;
  static COMMA: number = 188;
  static MINUS: number = 189;
  static PERIOD: number = 190;
  static SLASH: number = 191;
  static BACKQUOTE: number = 192;
  static LEFTBRACKET: number = 219;
  static BACKSLASH: number = 220;
  static RIGHTBRACKET: number = 221;
  static QUOTE: number = 222;
  static ALTERNATE: number = 18;
  static BACKSPACE: number = 8;
  static CAPS_LOCK: number = 20;
  static COMMAND: number = 15;
  static CONTROL: number = 17;
  static DELETE: number = 46;
  static DOWN: number = 40;
  static END: number = 35;
  static ENTER: number = 13;
  static ESCAPE: number = 27;
  static F1: number = 112;
  static F2: number = 113;
  static F3: number = 114;
  static F4: number = 115;
  static F5: number = 116;
  static F6: number = 117;
  static F7: number = 118;
  static F8: number = 119;
  static F9: number = 120;
  static F10: number = 121;
  static F11: number = 122;
  static F12: number = 123;
  static F13: number = 124;
  static F14: number = 125;
  static F15: number = 126;
  static HOME: number = 36;
  static INSERT: number = 45;
  static LEFT: number = 37;
  static NUMPAD: number = 21;
  static NUMPAD_0: number = 96;
  static NUMPAD_1: number = 97;
  static NUMPAD_2: number = 98;
  static NUMPAD_3: number = 99;
  static NUMPAD_4: number = 100;
  static NUMPAD_5: number = 101;
  static NUMPAD_6: number = 102;
  static NUMPAD_7: number = 103;
  static NUMPAD_8: number = 104;
  static NUMPAD_9: number = 105;
  static NUMPAD_ADD: number = 107;
  static NUMPAD_DECIMAL: number = 110;
  static NUMPAD_DIVIDE: number = 111;
  static NUMPAD_ENTER: number = 108;
  static NUMPAD_MULTIPLY: number = 106;
  static NUMPAD_SUBTRACT: number = 109;
  static PAGE_DOWN: number = 34;
  static PAGE_UP: number = 33;
  static RIGHT: number = 39;
  static SHIFT: number = 16;
  static SPACE: number = 32;
  static TAB: number = 9;
  static UP: number = 38;
  static RED: number = 16777216;
  static GREEN: number = 16777217;
  static YELLOW: number = 16777218;
  static BLUE: number = 16777219;
  static CHANNEL_UP: number = 16777220;
  static CHANNEL_DOWN: number = 16777221;
  static RECORD: number = 16777222;
  static PLAY: number = 16777223;
  static PAUSE: number = 16777224;
  static STOP: number = 16777225;
  static FAST_FORWARD: number = 16777226;
  static REWIND: number = 16777227;
  static SKIP_FORWARD: number = 16777228;
  static SKIP_BACKWARD: number = 16777229;
  static NEXT: number = 16777230;
  static PREVIOUS: number = 16777231;
  static LIVE: number = 16777232;
  static LAST: number = 16777233;
  static MENU: number = 16777234;
  static INFO: number = 16777235;
  static GUIDE: number = 16777236;
  static EXIT: number = 16777237;
  static BACK: number = 16777238;
  static AUDIO: number = 16777239;
  static SUBTITLE: number = 16777240;
  static DVR: number = 16777241;
  static VOD: number = 16777242;
  static INPUT: number = 16777243;
  static SETUP: number = 16777244;
  static HELP: number = 16777245;
  static MASTER_SHELL: number = 16777246;
  static SEARCH: number = 16777247;

  static codeMap: Record<string, number> = {
    Digit0: Keyboard.NUMBER_0,
    Digit1: Keyboard.NUMBER_1,
    Digit2: Keyboard.NUMBER_2,
    Digit3: Keyboard.NUMBER_3,
    Digit4: Keyboard.NUMBER_4,
    Digit5: Keyboard.NUMBER_5,
    Digit6: Keyboard.NUMBER_6,
    Digit7: Keyboard.NUMBER_7,
    Digit8: Keyboard.NUMBER_8,
    Digit9: Keyboard.NUMBER_9,

    KeyA: Keyboard.A,
    KeyB: Keyboard.B,
    KeyC: Keyboard.C,
    KeyD: Keyboard.D,
    KeyE: Keyboard.E,
    KeyF: Keyboard.F,
    KeyG: Keyboard.G,
    KeyH: Keyboard.H,
    KeyJ: Keyboard.J,
    KeyK: Keyboard.K,
    KeyL: Keyboard.L,
    KeyM: Keyboard.M,
    KeyN: Keyboard.N,
    KeyO: Keyboard.O,
    KeyP: Keyboard.P,
    KeyQ: Keyboard.Q,
    KeyR: Keyboard.R,
    KeyS: Keyboard.S,
    KeyT: Keyboard.T,
    KeyU: Keyboard.U,
    KeyV: Keyboard.V,
    KeyW: Keyboard.W,
    KeyX: Keyboard.X,
    KeyY: Keyboard.Y,
    KeyZ: Keyboard.Z,

    Semicolon: Keyboard.SEMICOLON,
    Equal: Keyboard.EQUAL,
    Comma: Keyboard.COMMA,
    Minus: Keyboard.MINUS,
    Period: Keyboard.PERIOD,
    Slash: Keyboard.SLASH,
    Backquote: Keyboard.BACKQUOTE,
    BracketLeft: Keyboard.LEFTBRACKET,
    Backslash: Keyboard.BACKSLASH,
    BracketRight: Keyboard.RIGHTBRACKET,
    Quote: Keyboard.QUOTE,
    AltLeft: Keyboard.ALTERNATE,
    AltRight: Keyboard.ALTERNATE,
    Backspace: Keyboard.BACKSPACE,
    CapsLock: Keyboard.CAPS_LOCK,
    ControlLeft: Keyboard.CONTROL,
    ControlRight: Keyboard.CONTROL,
    Delete: Keyboard.DELETE,
    ArrowDown: Keyboard.DOWN,
    End: Keyboard.END,
    Enter: Keyboard.ENTER,
    Escape: Keyboard.ESCAPE,
    F1: Keyboard.F1,
    F2: Keyboard.F2,
    F3: Keyboard.F3,
    F4: Keyboard.F4,
    F5: Keyboard.F5,
    F6: Keyboard.F6,
    F7: Keyboard.F7,
    F8: Keyboard.F8,
    F9: Keyboard.F9,
    F10: Keyboard.F10,
    F11: Keyboard.F11,
    F12: Keyboard.F12,
    F13: Keyboard.F13,
    F14: Keyboard.F14,
    F15: Keyboard.F15,
    Home: Keyboard.HOME,
    Insert: Keyboard.INSERT,
    ArrowLeft: Keyboard.LEFT,
    Numpad0: Keyboard.NUMPAD_0,
    Numpad1: Keyboard.NUMPAD_1,
    Numpad2: Keyboard.NUMPAD_2,
    Numpad3: Keyboard.NUMPAD_3,
    Numpad4: Keyboard.NUMPAD_4,
    Numpad5: Keyboard.NUMPAD_5,
    Numpad6: Keyboard.NUMPAD_6,
    Numpad7: Keyboard.NUMPAD_7,
    Numpad8: Keyboard.NUMPAD_8,
    Numpad9: Keyboard.NUMPAD_9,
    NumpadAdd: Keyboard.NUMPAD_ADD,
    NumpadDecimal: Keyboard.NUMPAD_DECIMAL,
    NumpadDivide: Keyboard.NUMPAD_DIVIDE,
    NumpadEnter: Keyboard.NUMPAD_ENTER,
    NumpadMultiply: Keyboard.NUMPAD_MULTIPLY,
    NumpadSubtract: Keyboard.NUMPAD_SUBTRACT,
    PageDown: Keyboard.PAGE_DOWN,
    PageUp: Keyboard.PAGE_UP,
    ArrowRight: Keyboard.RIGHT,
    ShiftLeft: Keyboard.SHIFT,
    ShiftRight: Keyboard.SHIFT,
    Space: Keyboard.SPACE,
    Tab: Keyboard.TAB,
    ArrowUp: Keyboard.UP,
  };
}
