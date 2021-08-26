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
  gameState.textAnimation = { ...gameState.textAnimation, text, ...options }
  await sleep(getTextRenderTime(gameState.textAnimation))
  gameState.textAnimation = {
    ...gameState.textAnimation,
    startedAt: null,
    text: "",
  }
}
