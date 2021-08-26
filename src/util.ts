import { gameState } from "./gameState"

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const log = (...strings: Array<string>) => {
  gameState.log = gameState.log.concat(...strings, "\n")
}
