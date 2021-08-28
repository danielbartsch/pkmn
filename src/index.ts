import * as textFormat from "./textFormat"
import { Menu, renderMenu, selectMenu, getMenu } from "./menu"
import { renderLifeBar } from "./lifeBar"
import { gameState, getStats, Fighter } from "./gameState"
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
  { startedAt, duration, from: fromLife }: Fighter["lifeBarAnimation"]
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

const renderNameBar = (fighter: Fighter, me: boolean, exactLife?: string) => {
  process.stdout.write(
    [
      "L[" + fighter.level + "]",
      fighter.type.name,
      me ? exactLife : "",
      renderStatusEffect(
        "atk",
        sumStatusEffects(fighter.statusEffects, "attack")
      ),
      renderStatusEffect(
        "def",
        sumStatusEffects(fighter.statusEffects, "defense")
      ),
      renderStatusEffect(
        "spd",
        sumStatusEffects(fighter.statusEffects, "speed")
      ),
    ]
      .filter((element) => element)
      .join(" ") + "\n"
  )
}

const renderTeamBar = (fighters: Array<Fighter>) => {
  const team =
    fighters
      .map((fighter) => (fighter.currentStats.life === 0 ? "○" : "◍"))
      .join(" ") + " "
  process.stdout.write(leftPad(team, WIDTH) + "\n")
}

const leftPad = (string: string, pad: number) => {
  if (string.length > pad) {
    return string
  }
  return " ".repeat(pad - string.length) + string
}

const WIDTH = 36
const HEIGHT = 13
const render = (menu: Array<Menu>, selected: number) => {
  clear({ width: WIDTH, height: HEIGHT })
  process.stdout.cursorTo(0, 0)

  renderTeamBar(gameState.enemy)
  renderNameBar(gameState.enemy[0], false)
  renderLifeBar({
    width: WIDTH,
    current: getInterpolatedLife(
      gameState.enemy[0].currentStats.life,
      gameState.enemy[0].lifeBarAnimation
    ),
    max: getStats(gameState.enemy[0]).life,
  })

  const meLifeInterpolated = getInterpolatedLife(
    gameState.me[0].currentStats.life,
    gameState.me[0].lifeBarAnimation
  )

  process.stdout.write("\n")
  renderTeamBar(gameState.me)
  renderNameBar(
    gameState.me[0],
    true,
    `HP[${Math.ceil(meLifeInterpolated)}/${getStats(gameState.me[0]).life}]`
  )
  renderLifeBar({
    width: WIDTH,
    current: meLifeInterpolated,
    max: getStats(gameState.me[0]).life,
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
  gameState.enemy.concat(gameState.me).forEach((player) => {
    player.currentStats = getStats(player)
  })
  while (true) {
    const menu = getMenu([gameState.enemy[0], gameState.me[0]])
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
    const currentMenu = selectMenu(
      getMenu([gameState.enemy[0], gameState.me[0]]),
      gameState.selected
    )

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
