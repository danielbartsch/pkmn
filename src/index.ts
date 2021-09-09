import * as textFormat from "./textFormat"
import { Menu, getMenuRender, selectMenu, getMenu } from "./menu"
import { getLifeBarRender } from "./lifeBar"
import { gameState, getStats, Fighter } from "./gameState"
import { leftPad, rightPad, sleep } from "./util"
import { sumStatusEffects } from "./round"

import "./input"
import { selectText } from "./animateText"

const getClearRender = ({ height, width }: { height: number; width: number }) =>
  Array.from({ length: height })
    .map(() => rightPad("", width))
    .join("\n")

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
    .join(" ")

const getTeamBarRender = (fighters: Array<Fighter>) =>
  leftPad(
    fighters
      .map((fighter) =>
        fighter.currentStats.life === 0
          ? textFormat.red("○")
          : textFormat.green("◍")
      )
      .join(" ") + " ",
    gameState.width
  )

const render = (menu: Array<Menu>, selected: number) => {
  const enemyLifeInterpolated = getInterpolatedLife(
    gameState.enemy[0].currentStats.life,
    gameState.enemy[0].lifeBarAnimation
  )
  const meLifeInterpolated = getInterpolatedLife(
    gameState.me[0].currentStats.life,
    gameState.me[0].lifeBarAnimation
  )
  const lines = [
    getTeamBarRender(gameState.enemy),
    "\n",
    getNameBarRender(
      gameState.enemy[0],
      textFormat.red(gameState.enemy[0].type.name),
      `HP[${Math.ceil(enemyLifeInterpolated)}/${
        getStats(gameState.enemy[0]).life
      }]`
    ),
    "\n",
    getLifeBarRender({
      width: gameState.width,
      current: enemyLifeInterpolated,
      max: getStats(gameState.enemy[0]).life,
    }),
    "\n\n",
    getTeamBarRender(gameState.me),
    "\n",
    getNameBarRender(
      gameState.me[0],
      textFormat.green(gameState.me[0].type.name),
      `HP[${Math.ceil(meLifeInterpolated)}/${getStats(gameState.me[0]).life}]`
    ),
    "\n",
    getLifeBarRender({
      width: gameState.width,
      current: meLifeInterpolated,
      max: getStats(gameState.me[0]).life,
    }),
    "\n\n",
    gameState.ownTurn
      ? getMenuRender(menu, selected)
      : getTextAnimationRender(gameState.textAnimation),
    gameState.log.length > 0
      ? "\n\n--- LOG ----------------------\n" +
        gameState.log
          .map((obj) => (obj === "\n" ? obj : JSON.stringify(obj)))
          .join(" ")
      : "",
  ]
    .join("")
    .split("\n")

  const frame = lines
    .concat(
      Array.from({ length: gameState.height - lines.length }).map(() => "")
    )
    .map((line) => rightPad(line, gameState.width) + "\n")
    .join("")

  process.stdout.cursorTo(0, 0)
  process.stdout.write(frame)
}

const run = async () => {
  gameState.width = 36
  gameState.height = 13

  gameState.enemy.concat(gameState.me).forEach((player) => {
    player.currentStats = getStats(player)
  })
  gameState.menu = getMenu(
    gameState.me[0],
    gameState.me.concat(gameState.enemy)
  )

  process.stdout.write(
    getClearRender({
      height: process.stdout.rows,
      width: process.stdout.columns,
    })
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
