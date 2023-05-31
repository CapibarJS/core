import { WriteStream } from 'node:fs';
import * as console from 'console';

const fs = require('node:fs');
const util = require('node:util');
const path = require('node:path');

class Color {
  static ColorRefs = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    italic: '\x1b[3m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',

    'f.black': '\x1b[30m',
    'f.red': '\x1b[31m',
    'f.green': '\x1b[32m',
    'f.yellow': '\x1b[33m',
    'f.blue': '\x1b[34m',
    'f.magenta': '\x1b[35m',
    'f.cyan': '\x1b[36m',
    'f.white': '\x1b[37m',
    'f.gray': '\x1b[90m',

    'b.black': '\x1b[40m',
    'b.red': '\x1b[41m',
    'b.green': '\x1b[42m',
    'b.yellow': '\x1b[43m',
    'b.blue': '\x1b[44m',
    'b.magenta': '\x1b[45m',
    'b.cyan': '\x1b[46m',
    'b.white': '\x1b[47m',
    'b.gray': '\x1b[100m',
  } as const;

  static color(c: keyof typeof Color.ColorRefs, v: string) {
    return `${Color.ColorRefs[c]}${v}`;
  }
}

const DATETIME_LENGTH = 19;

const LOG_TYPE: Record<
  string,
  Record<'f' | 'b' | 'fb', keyof typeof Color.ColorRefs>
> = {
  info: { f: 'f.cyan', b: 'b.blue', fb: 'f.black' },
  log: { f: 'f.gray', b: 'b.gray', fb: 'f.black' },
  debug: { f: 'f.magenta', b: 'b.magenta', fb: 'f.black' },
  warn: { f: 'f.yellow', b: 'b.yellow', fb: 'f.black' },
  error: { f: 'f.red', b: 'b.red', fb: 'f.black' },
};
const MaxLength = Math.max(...Object.keys(LOG_TYPE).map((s) => s.length)) + 2;
export class Logger implements Partial<Console> {
  path: string;
  stream: WriteStream;
  regexp: RegExp;

  constructor(logPath: string) {
    this.path = logPath;
    if (!fs.existsSync(logPath)) fs.mkdirSync(logPath, { recursive: true });
    const date = new Date().toISOString().substring(0, 10);
    const filePath = path.join(logPath, `${date}.log`);
    this.stream = fs.createWriteStream(filePath, { flags: 'a' });
    this.regexp = new RegExp(path.dirname(this.path), 'g');
  }

  static create(logPath = 'log') {
    return new Logger(logPath);
  }

  write(type: keyof typeof LOG_TYPE, s) {
    const now = new Date().toISOString();
    const [date, time] = now.substring(0, DATETIME_LENGTH).split('T');
    const logColor = LOG_TYPE[type];
    const colors = Color.ColorRefs;
    const paddedType = (() => {
      const paddingLength = MaxLength - type.length;
      const leftPadding = ' '.repeat(Math.floor(paddingLength / 2));
      const rightPadding = ' '.repeat(Math.ceil(paddingLength / 2));
      return leftPadding + type + rightPadding;
    })();
    const line = [
      [colors[logColor.f], colors.bold, '\r', time],
      [
        colors.bold,
        colors.italic,
        colors[logColor.b],
        colors[logColor.fb],
        paddedType,
        colors.reset,
      ],
      [colors.bold, colors[logColor.f], s, colors['reset']],
    ].map((x) => x.join(''));
    console.log(line.join(' '));

    const lineStr = `${date} ${time} [${type.toUpperCase()}]: ${s}`;
    const out = lineStr.replace(/[\n\r]\s*/g, '; ') + '\n';
    this.stream.write(out);
  }

  log(...args) {
    const msg = util.format(...args);
    this.write('log', msg);
  }

  dir(...args) {
    const msg = util.inspect(...args);
    this.write('log', msg);
  }

  debug(...args) {
    const msg = util.format(...args);
    this.write('debug', msg);
  }

  warn(...args) {
    const msg = util.format(...args);
    this.write('warn', msg);
  }

  error(msg: string, ...args) {
    // const msg = util.format(...args).replace(/[\n\r]{2,}/g, '\n');
    this.write('error', [msg, ...args].join(' '));
  }

  info(...args) {
    const msg = util.format(...args);
    this.write('info', msg);
  }
}
