import * as textFormat from "./textFormat"
import { Menu, renderMenu, selectMenu, menu, Attack, attacks } from "./menu"

type Player = {
  life: number
  lifeMax: number
  lifebarAnimation: {
    startedAt: number | null
    from: number | null
    duration: number
  }
}

type GameState = {
  enemy: Player
  me: Player
  ownTurn: boolean
  selected: Array<number>
  textAnimation: {
    startedAt: number | null
    text: string
    textSpeed: number
    textColor: "white" | "green" | "black" | "yellow"
  }
  log: Array<any>
}

const gameState: GameState = {
  enemy: {
    life: 100,
    lifeMax: 100,
    lifebarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
  },
  me: {
    life: 100,
    lifeMax: 100,
    lifebarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
  },
  ownTurn: true,
  selected: [0],
  textAnimation: {
    startedAt: null,
    text: "",
    textSpeed: 50, // one character every <this value> milliseconds
    textColor: "white",
  },

  log: [],
}

const { columns: width, rows: height } = process.stdout
const clear = ({ width, height, char = " " }) => {
  process.stdout.cursorTo(0, 0)
  process.stdout.write((char.repeat(width) + "\n").repeat(height - 1))
}

const renderTextAnimation = ({
  startedAt,
  text,
  textSpeed,
  textColor,
}: typeof gameState["textAnimation"]) => {
  if (startedAt) {
    const characterCount = (Date.now() - startedAt) / textSpeed
    process.stdout.write(textFormat[textColor](text.slice(0, characterCount)))
  }
}

const renderLifeBar = ({ width, current, max }) => {
  const lifePercentage = current / max
  const lifeRemainingRelative = lifePercentage * width
  const format =
    lifePercentage < 0.125
      ? textFormat.red
      : lifePercentage < 0.5
      ? textFormat.yellow
      : textFormat.green

  process.stdout.write(
    format(
      "█".repeat(Math.floor(lifeRemainingRelative)) +
        getFractionLifeBar(
          Math.ceil(lifeRemainingRelative) - lifeRemainingRelative
        )
    ) + "\n"
  )
}

const getFractionLifeBar = (fraction) => {
  if (fraction === 0) return ""
  if (fraction < 0.125) return "█"
  if (fraction < 0.25) return "▉"
  if (fraction < 0.375) return "▊"
  if (fraction < 0.5) return "▋"
  if (fraction < 0.625) return "▌"
  if (fraction < 0.75) return "▍"
  if (fraction < 0.875) return "▎"
  if (fraction < 1) return "▏"
  return " "
}

const getAnimatedLifeBar = (lifebar: "enemy" | "me") => {
  const duration = Date.now() - gameState[lifebar].lifebarAnimation.startedAt
  const percentageAnimation =
    duration > gameState[lifebar].lifebarAnimation.duration
      ? 0
      : 1 - duration / gameState[lifebar].lifebarAnimation.duration

  const value = Math.floor(
    gameState[lifebar].lifebarAnimation.startedAt
      ? gameState[lifebar].life +
          percentageAnimation *
            (gameState[lifebar].lifebarAnimation.from - gameState[lifebar].life)
      : gameState[lifebar].life
  )
  return value <= 0 ? 0 : value
}

const WIDTH = 30
const HEIGHT = 11
const render = (menu: Array<Menu>, selected: number) => {
  clear({ width: WIDTH, height: HEIGHT })
  process.stdout.cursorTo(0, 0)

  process.stdout.write("Enemy\n")
  renderLifeBar({
    width: WIDTH,
    current: getAnimatedLifeBar("enemy"),
    max: gameState.enemy.lifeMax,
  })

  const meLifeAnimated = getAnimatedLifeBar("me")
  process.stdout.write(`\nYou (${meLifeAnimated}/${gameState.me.lifeMax})\n`)
  renderLifeBar({
    width: WIDTH,
    current: meLifeAnimated,
    max: gameState.me.lifeMax,
  })
  process.stdout.write("\n")

  if (gameState.ownTurn) {
    renderMenu(menu, selected)
  } else {
    renderTextAnimation(gameState.textAnimation)
  }

  if (gameState.log.length > 0) {
    process.stdout.write(
      "\n\n--- LOG ----------------------\n" +
        gameState.log.map((obj) => JSON.stringify(obj)).join(" ")
    )
  }
}

const run = async () => {
  clear({ width, height })
  clear({ width: WIDTH + 1, height: HEIGHT + 1, char: "█" })
  while (true) {
    render(
      selectMenu(menu, gameState.selected),
      gameState.selected[gameState.selected.length - 1]
    )
    await sleep(16)
  }
}

run()

const USER_READING_THRESHOLD = 400
const getTextRenderTime = (textAnimation: GameState["textAnimation"]) =>
  textAnimation.text.length * textAnimation.textSpeed + USER_READING_THRESHOLD

const animateText = async (
  textAnimation: Partial<GameState["textAnimation"]>
) => {
  textAnimation.startedAt = textAnimation.startedAt ?? Date.now()
  gameState.textAnimation = { ...gameState.textAnimation, ...textAnimation }
  await sleep(getTextRenderTime(gameState.textAnimation))
  gameState.textAnimation = {
    ...gameState.textAnimation,
    startedAt: null,
    text: "",
  }
}

const variancePercent = () => {
  const variance = 0.1
  return Math.random() * variance + (1 - variance / 2)
}

const attack = async (
  menuEntry: Attack,
  gameState: GameState,
  target: "enemy" | "me"
) => {
  await animateText({
    text:
      (target === "enemy" ? "You use " : "Enemy uses ") + menuEntry.label + ".",
  })

  if (Math.random() < menuEntry.chanceToSucceed) {
    const isCritical = Math.random() < menuEntry.chanceToCritical

    gameState[target].lifebarAnimation.from = gameState[target].life
    gameState[target].lifebarAnimation.startedAt = Date.now()
    gameState[target].life -= Math.round(
      (isCritical ? 2 : 1) * menuEntry.damage * variancePercent()
    )

    if (gameState[target].life <= 0) {
      gameState[target].life = 0
    }

    if (menuEntry.damage !== 0) {
      await sleep(gameState[target].lifebarAnimation.duration)
    }
    if (isCritical) {
      await animateText({ text: "Critical hit!" })
    }
  } else {
    await animateText({ text: menuEntry.label + " missed!" })
  }
}

function log(...strings) {
  gameState.log = [...strings]
}

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding("utf8")

process.stdin.on("data", async function (key: string) {
  if (key == KEYS.ctrlC) {
    process.exit()
  }
  if (gameState.ownTurn) {
    const lastSelected = gameState.selected[gameState.selected.length - 1]
    const currentMenu = selectMenu(menu, gameState.selected)

    switch (key) {
      case KEYS.right: {
        gameState.selected[gameState.selected.length - 1] =
          (lastSelected + 1) % currentMenu.length
        break
      }
      case KEYS.left: {
        gameState.selected[gameState.selected.length - 1] =
          lastSelected - 1 < 0
            ? lastSelected - 1 + currentMenu.length
            : lastSelected - 1
        break
      }
      case KEYS.escape: {
        gameState.selected.pop()
        if (gameState.selected.length === 0) {
          process.exit()
        }
        break
      }
      case KEYS.enter: {
        const menuEntry = currentMenu[lastSelected]
        if (Array.isArray(menuEntry)) {
          gameState.selected.push(0)
        } else {
          switch (menuEntry.type) {
            case "action": {
              gameState.ownTurn = false
              gameState.selected = [0]
              if (menuEntry.key === "flee") {
                if (Math.random() < menuEntry.chanceToSucceed) {
                  await animateText({ text: "You fled!" })
                  process.exit(0)
                } else {
                  await animateText({ text: "Couldn't flee." })
                }
              } else {
                await attack(menuEntry, gameState, "enemy")
              }

              if (gameState.enemy.life <= 0) {
                gameState.ownTurn = false
                await animateText({
                  text:
                    "Enemy cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
                    textFormat.green("You won!"),
                })
                process.exit(0)
              }

              await attack(
                attacks[Math.floor(Math.random() * attacks.length)],
                gameState,
                "me"
              )

              if (gameState.me.life <= 0) {
                await animateText({
                  text:
                    "You cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
                    textFormat.red("You lost!"),
                })
                process.exit(0)
              }
              gameState.ownTurn = true

              break
            }

            case "setting": {
              switch (menuEntry.key) {
                case "normal": {
                  gameState.textAnimation.textSpeed = 50
                  break
                }
                case "slow": {
                  gameState.textAnimation.textSpeed = 150
                  break
                }
                case "fast": {
                  gameState.textAnimation.textSpeed = 10
                  break
                }
                case "yellow": {
                  gameState.textAnimation.textColor = "yellow"
                  break
                }
                case "black": {
                  gameState.textAnimation.textColor = "black"
                  break
                }
                case "white": {
                  gameState.textAnimation.textColor = "white"
                  break
                }
                case "green": {
                  gameState.textAnimation.textColor = "green"
                  break
                }
              }
              gameState.selected = [0]
              break
            }
            case "menu":
          }
        }
        break
      }
    }
  }
})

const KEYS = {
  up: "\u001B\u005B\u0041",
  right: "\u001B\u005B\u0043",
  down: "\u001B\u005B\u0042",
  left: "\u001B\u005B\u0044",
  enter: "\r",
  escape: "\u001b",
  ctrlC: "\u0003",
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
