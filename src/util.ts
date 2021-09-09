import { textLength } from "./animateText"
import { gameState } from "./gameState"

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const log = (...strings: Array<string>) => {
  gameState.log = gameState.log.concat(...strings, "\n")
}

export const rightPad = (string: string, padding: number) => {
  const stringLength = textLength(string)
  if (stringLength > padding) {
    return string
  }
  return string + pad(" ", padding - stringLength)
}

export const leftPad = (string: string, padding: number) => {
  const stringLength = textLength(string)
  if (stringLength > padding) {
    return string
  }
  return pad(" ", padding - stringLength) + string
}

const pad = (char: string, times: number) => char.repeat(times)
