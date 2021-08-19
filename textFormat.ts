const RESET = "\x1b[0m"
const getColorFormatter = (color: string) => (text: string) =>
  color + text + RESET
const bold = getColorFormatter("\x1b[1m")
const dim = getColorFormatter("\x1b[2m")
const underline = getColorFormatter("\x1b[4m")
const blink = getColorFormatter("\x1b[5m")
const reverse = getColorFormatter("\x1b[7m")
const hidden = getColorFormatter("\x1b[8m")
const black = getColorFormatter("\x1b[30m")
const red = getColorFormatter("\x1b[31m")
const green = getColorFormatter("\x1b[32m")
const yellow = getColorFormatter("\x1b[33m")
const blue = getColorFormatter("\x1b[34m")
const magenta = getColorFormatter("\x1b[35m")
const cyan = getColorFormatter("\x1b[36m")
const white = getColorFormatter("\x1b[37m")
const bgBlack = getColorFormatter("\x1b[40m")
const bgRed = getColorFormatter("\x1b[41m")
const bgGreen = getColorFormatter("\x1b[42m")
const bgYellow = getColorFormatter("\x1b[43m")
const bgBlue = getColorFormatter("\x1b[44m")
const bgMagenta = getColorFormatter("\x1b[45m")
const bgCyan = getColorFormatter("\x1b[46m")

export {
  bold,
  dim,
  underline,
  blink,
  reverse,
  hidden,
  black,
  red,
  green,
  yellow,
  blue,
  magenta,
  cyan,
  white,
  bgBlack,
  bgRed,
  bgGreen,
  bgYellow,
  bgBlue,
  bgMagenta,
  bgCyan,
}
