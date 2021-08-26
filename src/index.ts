import * as textFormat from "./textFormat"
import { Menu, renderMenu, selectMenu, menu } from "./menu"
import { renderLifeBar } from "./lifeBar"
import { gameState, getStats, Player } from "./gameState"
import { sleep } from "./util"
import { round, sumStatusEffects } from "./round"

const { columns: width, rows: height } = process.stdout
const clear = ({
  width,
  height,
  char = " ",
}: {
  width: number
  height: number
  char?: string
}) => {
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

  const value = startedAt
    ? targetLife + percentageAnimation * (fromLife - targetLife)
    : targetLife

  return value <= 0 ? 0 : value
}

const renderStatusEffect = (name: string, severity: number) =>
  severity === 0 ? "" : name + (severity > 0 ? "+" + severity : severity)

const renderName = (
  name: string,
  statusEffects: Array<Status>,
  exactLife?: string
) => {
  process.stdout.write(
    [
      name,
      exactLife,
      renderStatusEffect("atk", sumStatusEffects(statusEffects, "attack")),
      renderStatusEffect("def", sumStatusEffects(statusEffects, "defense")),
      renderStatusEffect("spd", sumStatusEffects(statusEffects, "speed")),
    ]
      .filter((element) => element)
      .join(" ") + "\n"
  )
}

const WIDTH = 30
const HEIGHT = 11
const render = (menu: Array<Menu>, selected: number) => {
  clear({ width: WIDTH, height: HEIGHT })
  process.stdout.cursorTo(0, 0)

  renderName("Enemy", gameState.enemy.statusEffects)
  renderLifeBar({
    width: WIDTH,
    current: getInterpolatedLife(
      gameState.enemy.currentStats.life,
      gameState.enemy.lifeBarAnimation
    ),
    max: getStats(gameState.enemy).life,
  })

  const meLifeInterpolated = getInterpolatedLife(
    gameState.me.currentStats.life,
    gameState.me.lifeBarAnimation
  )

  process.stdout.write("\n")
  renderName(
    "You",
    gameState.me.statusEffects,
    `(${Math.floor(meLifeInterpolated)}/${gameState.me.baseStats.life})`
  )
  renderLifeBar({
    width: WIDTH,
    current: meLifeInterpolated,
    max: getStats(gameState.me).life,
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
        gameState.log
          .map((obj) => (obj === "\n" ? obj : JSON.stringify(obj)))
          .join(" ")
    )
  }
}

const run = async () => {
  clear({ width, height })
  clear({ width: WIDTH + 1, height: HEIGHT + 1, char: "█" })
  gameState.enemy.currentStats = getStats(gameState.enemy)
  gameState.me.currentStats = getStats(gameState.me)
  while (true) {
    render(
      selectMenu(menu, gameState.selected),
      gameState.selected[gameState.selected.length - 1]
    )
    await sleep(16)
  }
}

run()

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
          const isSameAsLast = gameState.selected.every(
            (selectedMenuIndex, index) =>
              selectedMenuIndex === gameState.lastSelected[index]
          )
          gameState.selected.push(
            isSameAsLast ? gameState.lastSelected[gameState.selected.length] : 0
          )
        } else {
          switch (menuEntry.type) {
            case "action": {
              await round(menuEntry)
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
