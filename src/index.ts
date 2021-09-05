import * as textFormat from "./textFormat"
import { Menu, getMenuRender, selectMenu, getMenu } from "./menu"
import { getLifeBarRender } from "./lifeBar"
import { gameState, getStats, Fighter } from "./gameState"
import { sleep } from "./util"
import { sumStatusEffects } from "./round"

import "./input"
import { selectText } from "./animateText"

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

const getTextAnimationRender = ({
  startedAt,
  text,
  textSpeed,
}: typeof gameState["textAnimation"]) => {
  if (startedAt) {
    const characterCount = (Date.now() - startedAt) / textSpeed
    return selectText(text, characterCount)
  }
  return ""
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

const getNameBarRender = (fighter: Fighter, name: string, exactLife?: string) =>
  [
    "L[" + fighter.level + "]",
    name,
    exactLife,
    renderStatusEffect(
      "atk",
      sumStatusEffects(fighter.statusEffects, "attack")
    ),
    renderStatusEffect(
      "def",
      sumStatusEffects(fighter.statusEffects, "defense")
    ),
    renderStatusEffect("spd", sumStatusEffects(fighter.statusEffects, "speed")),
  ]
    .filter((element) => element)
    .join(" ") + "\n"

const getTeamBarRender = (fighters: Array<Fighter>) => {
  const team = fighters.map((fighter) =>
    fighter.currentStats.life === 0
      ? textFormat.red("○")
      : textFormat.green("◍")
  )

  return (
    leftPad(team.join(" ") + " ", gameState.width, fighters.length * 2 + 1) +
    "\n"
  )
}

const leftPad = (string: string, pad: number, stringLength = string.length) => {
  if (stringLength > pad) {
    return string
  }
  return " ".repeat(pad - stringLength) + string
}

const render = (menu: Array<Menu>, selected: number) => {
  clear({ width: gameState.width, height: gameState.height })
  process.stdout.cursorTo(0, 0)

  const enemyLifeInterpolated = getInterpolatedLife(
    gameState.enemy[0].currentStats.life,
    gameState.enemy[0].lifeBarAnimation
  )

  const meLifeInterpolated = getInterpolatedLife(
    gameState.me[0].currentStats.life,
    gameState.me[0].lifeBarAnimation
  )

  process.stdout.write(
    [
      getTeamBarRender(gameState.enemy),
      getNameBarRender(
        gameState.enemy[0],
        textFormat.red(gameState.enemy[0].type.name),
        `HP[${Math.ceil(enemyLifeInterpolated)}/${
          getStats(gameState.enemy[0]).life
        }]`
      ),
      getLifeBarRender({
        width: gameState.width,
        current: enemyLifeInterpolated,
        max: getStats(gameState.enemy[0]).life,
      }),
      "\n",
      getTeamBarRender(gameState.me),
      getNameBarRender(
        gameState.me[0],
        textFormat.green(gameState.me[0].type.name),
        `HP[${Math.ceil(meLifeInterpolated)}/${getStats(gameState.me[0]).life}]`
      ),
      getLifeBarRender({
        width: gameState.width,
        current: meLifeInterpolated,
        max: getStats(gameState.me[0]).life,
      }),
      "\n",
      gameState.ownTurn
        ? getMenuRender(menu, selected)
        : getTextAnimationRender(gameState.textAnimation),
      gameState.log.length > 0
        ? "\n\n--- LOG ----------------------\n" +
          gameState.log
            .map((obj) => (obj === "\n" ? obj : JSON.stringify(obj)))
            .join(" ")
        : "",
    ].join("")
  )
}

const run = async () => {
  gameState.width = 36
  gameState.height = 13

  clear({ width, height })
  clear({ width: gameState.width + 1, height: gameState.height + 1, char: "█" })
  gameState.enemy.concat(gameState.me).forEach((player) => {
    player.currentStats = getStats(player)
  })
  gameState.menu = getMenu(
    gameState.me[0],
    gameState.me.concat(gameState.enemy)
  )
  while (true) {
    render(
      selectMenu(gameState.menu, gameState.selected),
      gameState.selected[gameState.selected.length - 1]
    )
    await sleep(16)
  }
}

run()
