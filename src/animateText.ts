import { gameState } from "./gameState"
import { sleep } from "./util"

const USER_READING_THRESHOLD = 400
const getTextRenderTime = (textAnimation: typeof gameState["textAnimation"]) =>
  textAnimation.text.replace(formattingRegex, "").length *
    textAnimation.textSpeed +
  USER_READING_THRESHOLD

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
    const preWrappedText = text.split("\n")
    const words = preWrappedText[preWrappedText.length - 1].split(" ")
    const { current: wordsUnderMaxWidth, missing } = words.reduce(
      (acc, word) => {
        if (acc.nextLine) {
          acc.missing.push(word)
        } else {
          if (textLength(acc.current.join(" ")) + textLength(word) < maxWidth) {
            acc.current.push(word)
          } else {
            acc.nextLine = true
            acc.missing.push(word)
          }
        }
        return acc
      },
      {
        current: [] as Array<string>,
        missing: [] as Array<string>,
        nextLine: false,
      }
    )
    return (
      (text.includes("\n")
        ? preWrappedText.slice(0, -1).join("\n") + "\n"
        : "") +
      wordsUnderMaxWidth.join(" ") +
      "\n" +
      wrapText(missing.join(" "), maxWidth)
    )
  }
  return text
}

const formattingRegex = /\x1b\[[0-9]+m/g

// text length without unprinted characters like formatting sequences
export const textLength = (text: string) =>
  text.replace(/(\0|\x1b\[[0-9]+m)/g, "").length

// select text without formatting characters
export const selectText = (text: string, index: number) => {
  let usedIndex = index

  let match
  while ((match = formattingRegex.exec(text)) !== null) {
    if (usedIndex >= match.index) {
      usedIndex += match[0].length
    }
  }

  return text.slice(0, usedIndex)
}
