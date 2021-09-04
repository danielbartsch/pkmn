import * as textFormat from "./textFormat"
import { Menu, renderMenu, selectMenu, getMenu } from "./menu"
import { renderLifeBar } from "./lifeBar"
import { gameState, getStats, Fighter } from "./gameState"
import { sleep } from "./util"
import { sumStatusEffects } from "./round"

import "./input"

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
  const team = fighters.map((fighter) =>
    fighter.currentStats.life === 0
      ? textFormat.red("○")
      : textFormat.green("◍")
  )

  process.stdout.write(
    leftPad(team.join(" ") + " ", WIDTH, fighters.length * 2 + 1) + "\n"
  )
}

const leftPad = (string: string, pad: number, stringLength = string.length) => {
  if (stringLength > pad) {
    return string
  }
  return " ".repeat(pad - stringLength) + string
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
    const menu = getMenu(gameState.me.concat(gameState.enemy))
    render(
      selectMenu(menu, gameState.selected),
      gameState.selected[gameState.selected.length - 1]
    )
    await sleep(16)
  }
}

run()
