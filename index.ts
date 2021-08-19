import * as textFormat from "./textFormat"
import { Menu, renderMenu, selectMenu, menu, Attack, attacks } from "./menu"
import { renderLifeBar } from "./lifeBar"

type Player = {
  life: number
  lifeMax: number
  lifeBarAnimation: {
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
    lifeBarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
  },
  me: {
    life: 100,
    lifeMax: 100,
    lifeBarAnimation: {
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

const getInterpolatedLife = (
  targetLife: number,
  { startedAt, duration, from: fromLife }: Player["lifeBarAnimation"]
) => {
  const passedTime = Date.now() - startedAt
  const percentageAnimation =
    passedTime > duration ? 0 : 1 - passedTime / duration

  const value = Math.floor(
    startedAt
      ? targetLife + percentageAnimation * (fromLife - targetLife)
      : targetLife
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
    current: getInterpolatedLife(
      gameState.enemy.life,
      gameState.enemy.lifeBarAnimation
    ),
    max: gameState.enemy.lifeMax,
  })

  const meLifeInterpolated = getInterpolatedLife(
    gameState.me.life,
    gameState.me.lifeBarAnimation
  )
  process.stdout.write(
    `\nYou (${meLifeInterpolated}/${gameState.me.lifeMax})\n`
  )
  renderLifeBar({
    width: WIDTH,
    current: meLifeInterpolated,
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
  text: GameState["textAnimation"]["text"],
  options: Partial<Omit<GameState["textAnimation"], "text">> = {}
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

// variance = 0.1 --> returns between 0.95 and 1.05
const variancePercent = (variance = 0.1) =>
  Math.random() * variance + (1 - variance / 2)

const attack = async (
  menuEntry: Attack,
  gameState: GameState,
  target: "enemy" | "me"
) => {
  await animateText(
    (target === "enemy" ? "You use " : "Enemy uses ") + menuEntry.label + "."
  )

  if (Math.random() < menuEntry.chanceToSucceed) {
    const isCritical = Math.random() < menuEntry.chanceToCritical

    gameState[target].lifeBarAnimation.from = gameState[target].life
    gameState[target].lifeBarAnimation.startedAt = Date.now()
    gameState[target].life -= Math.round(
      (isCritical ? 2 : 1) * menuEntry.damage * variancePercent()
    )

    if (gameState[target].life <= 0) {
      gameState[target].life = 0
    }

    if (menuEntry.damage !== 0) {
      await sleep(gameState[target].lifeBarAnimation.duration)
    }
    if (isCritical) {
      await animateText("Critical hit!")
    }
  } else {
    await animateText(menuEntry.label + " missed!")
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
                  await animateText("You fled!")
                  process.exit(0)
                } else {
                  await animateText("Couldn't flee.")
                }
              } else {
                await attack(menuEntry, gameState, "enemy")
              }

              if (gameState.enemy.life <= 0) {
                gameState.ownTurn = false
                await animateText(
                  "Enemy cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
                    textFormat.green("You won!")
                )
                process.exit(0)
              }

              await attack(
                attacks[Math.floor(Math.random() * attacks.length)],
                gameState,
                "me"
              )

              if (gameState.me.life <= 0) {
                await animateText(
                  "You cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
                    textFormat.red("You lost!")
                )
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
