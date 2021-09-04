import { gameState } from "./gameState"
import { sleep } from "./util"

const USER_READING_THRESHOLD = 400
const getTextRenderTime = (textAnimation: typeof gameState["textAnimation"]) =>
  textAnimation.text.length * textAnimation.textSpeed + USER_READING_THRESHOLD

export const animateText = async (
  text: typeof gameState["textAnimation"]["text"],
  options: Partial<Omit<typeof gameState["textAnimation"], "text">> = {}
) => {
  options.startedAt = options.startedAt ?? Date.now()
  gameState.textAnimation = {
    ...gameState.textAnimation,
    text: wrapText(text, gameState.width),
    ...options,
  }
  await sleep(getTextRenderTime(gameState.textAnimation))
  gameState.textAnimation = {
    ...gameState.textAnimation,
    startedAt: null,
    text: "",
  }
}

export const wrapText = (text: string, maxWidth: number): string => {
  if (textLength(text) > maxWidth) {
    const words = text.split(" ")
    const { current: wordsUnderMaxWidth, missing } = words.reduce(
      (acc, word) => {
        if (textLength(acc.current.join(" ")) + textLength(word) < maxWidth) {
          acc.current.push(word)
        } else {
          acc.missing.push(word)
        }
        return acc
      },
      { current: [] as Array<string>, missing: [] as Array<string> }
    )
    return (
      wordsUnderMaxWidth.join(" ") +
      "\n" +
      wrapText(missing.join(" "), maxWidth)
    )
  }
  return text
}

// text length without unprinted characters like formatting sequences
export const textLength = (text: string) =>
  text.replace(/(\0|\x1b\[[0-9]+m)/g, "").length
