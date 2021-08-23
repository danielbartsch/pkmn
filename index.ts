import * as textFormat from "./textFormat"
import { Menu, renderMenu, selectMenu, menu, Attack, attacks } from "./menu"
import { renderLifeBar } from "./lifeBar"
import { gameState, Player, Status } from "./gameState"
import { sleep } from "./util"
import { animateText } from "./animateText"

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

const sumStatusEffects = (
  statusEffects: Array<Status>,
  changeToSum: Status["change"]
): -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
  const sum = statusEffects.reduce(
    (acc, { severity, change }) =>
      acc + (change === changeToSum ? severity : 0),
    0
  )
  return Math.abs(sum) > 6 ? (Math.max(-6, Math.min(6, sum)) as any) : sum
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
      gameState.enemy.life,
      gameState.enemy.lifeBarAnimation
    ),
    max: gameState.enemy.lifeMax,
  })

  const meLifeInterpolated = getInterpolatedLife(
    gameState.me.life,
    gameState.me.lifeBarAnimation
  )

  process.stdout.write("\n")
  renderName(
    "You",
    gameState.me.statusEffects,
    `(${meLifeInterpolated}/${gameState.me.lifeMax})`
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

const statusEffectAttackMultipliers: Record<
  -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6,
  number
> = {
  "-6": 1 / 2.5,
  "-5": 1 / 2.25,
  "-4": 1 / 2,
  "-3": 1 / 1.75,
  "-2": 1 / 1.5,
  "-1": 1 / 1.25,
  "0": 1,
  "1": 1.25,
  "2": 1.5,
  "3": 1.75,
  "4": 2,
  "5": 2.25,
  "6": 2.5,
}

// variance = 0.1 --> returns between 0.95 and 1.05
const variancePercent = (variance = 0.2) =>
  Math.random() * variance + (1 - variance / 2)

const attack = async (menuEntry: Attack, actor: Player, target: Player) => {
  if (Math.random() < menuEntry.chanceToSucceed) {
    const isCritical = Math.random() < menuEntry.chanceToCritical

    target.lifeBarAnimation.from = target.life
    target.lifeBarAnimation.startedAt = Date.now()

    const targetStatusEffects =
      statusEffectAttackMultipliers[
        sumStatusEffects(target.statusEffects, "defense")
      ]
    const actorStatusEffects =
      statusEffectAttackMultipliers[
        sumStatusEffects(actor.statusEffects, "attack")
      ]

    target.life -= Math.round(
      (isCritical ? 2 : 1) *
        menuEntry.damage *
        targetStatusEffects *
        actorStatusEffects *
        variancePercent()
    )

    if (target.life <= 0) {
      target.life = 0
    }

    menuEntry.statusEffects?.forEach(
      ({ change, severity, target: statusEffectTarget }) => {
        const player = statusEffectTarget === "enemy" ? target : actor
        player.statusEffects.push({
          change,
          severity,
        })
      }
    )

    if (menuEntry.damage !== 0) {
      await sleep(target.lifeBarAnimation.duration)
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
              gameState.lastSelected = gameState.selected
              gameState.ownTurn = false
              gameState.selected = [gameState.lastSelected[0]]

              const actions = {
                meAction: async () => {
                  if (menuEntry.key === "flee") {
                    if (Math.random() < menuEntry.chanceToSucceed) {
                      await animateText("You fled!")
                      process.exit(0)
                    } else {
                      await animateText("Couldn't flee.")
                    }
                  } else {
                    await animateText("You use " + menuEntry.label + ".")
                    await attack(menuEntry, gameState.me, gameState.enemy)
                  }

                  if (gameState.enemy.life <= 0) {
                    gameState.ownTurn = false
                    await animateText(
                      "Enemy cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
                        textFormat.green("You won!")
                    )
                    process.exit(0)
                  }
                },
                enemyAction: async () => {
                  const enemyMenuEntry =
                    attacks[Math.floor(Math.random() * attacks.length)]
                  await animateText("Enemy uses " + enemyMenuEntry.label + ".")
                  await attack(enemyMenuEntry, gameState.enemy, gameState.me)

                  if (gameState.me.life <= 0) {
                    await animateText(
                      "You cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
                        textFormat.red("You lost!")
                    )
                    process.exit(0)
                  }
                },
              }

              const meSpeed = sumStatusEffects(
                gameState.me.statusEffects,
                "speed"
              )
              const enemySpeed = sumStatusEffects(
                gameState.enemy.statusEffects,
                "speed"
              )
              const actionOrder =
                meSpeed > enemySpeed
                  ? ["meAction", "enemyAction"]
                  : meSpeed < enemySpeed
                  ? ["enemyAction", "meAction"]
                  : Math.random() < 0.5
                  ? ["meAction", "enemyAction"]
                  : ["enemyAction", "meAction"]

              await actions[actionOrder[0]]()
              await actions[actionOrder[1]]()

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
