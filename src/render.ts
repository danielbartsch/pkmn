import { selectText, wrapText } from "./animateText"
import { Fighter, gameState, getStats } from "./gameState"
import { sumStatusEffects } from "./round"
import { leftPad, rightPad } from "./util"
import * as textFormat from "./textFormat"
import { Menu } from "./menu"

export const getClearRender = ({
  height,
  width,
}: {
  height: number
  width: number
}) =>
  Array.from({ length: height })
    .map(() => rightPad("", width))
    .join("\n")

export const render = (menu: Array<Menu>, selected: number) => {
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
      `HP[${formatFractional(enemyLifeInterpolated, 1)}/${formatFractional(
        getStats(gameState.enemy[0]).life,
        1
      )}]`
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
      `HP[${formatFractional(meLifeInterpolated, 1)}/${formatFractional(
        getStats(gameState.me[0]).life,
        1
      )}]`
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
  process.stdout.cursorTo(process.stdout.columns - 1, process.stdout.rows - 1)
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

const getNameBarRender = (fighter: Fighter, name: string, exactLife?: string) =>
  [
    "L[" + formatFractional(fighter.level, 1) + "]",
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

const renderStatusEffect = (name: string, severity: number) =>
  severity === 0 ? "" : name + (severity > 0 ? "+" + severity : severity)

const getLifeBarRender = ({
  width,
  current,
  max,
}: {
  width: number
  current: number
  max: number
}) => {
  const lifePercentage = current / max
  const lifeRemainingRelative = lifePercentage * width
  const format =
    lifePercentage < 0.125
      ? textFormat.red
      : lifePercentage < 0.5
      ? textFormat.yellow
      : textFormat.green

  return current === 0
    ? textFormat.bgRed(textFormat.black(textFormat.bold(" D E F E A T E D ")))
    : format(
        "█".repeat(Math.floor(lifeRemainingRelative)) +
          getFractionLifeBar(
            Math.ceil(lifeRemainingRelative) - lifeRemainingRelative
          )
      )
}

const getFractionLifeBar = (fraction: number) => {
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

export const getMenuRender = (menu: Array<Menu>, selected: number) => {
  const renderedMenu = wrapText(
    menu
      .map((name, index) => {
        const format = index === selected ? selectedMenu : selectableMenu
        return format(Array.isArray(name) ? name[0].label : name.label)
      })
      .join(" "),
    gameState.width
  )

  const verticalClearance = renderedMenu.includes("\n") ? "" : "\n"

  const currentMenu = menu[selected]

  let info = ""
  if (!Array.isArray(currentMenu)) {
    if (currentMenu.key !== "flee" && currentMenu.type === "action") {
      info =
        "\n Damage   " +
        currentMenu.damage +
        "\n Accuracy " +
        currentMenu.chanceToSucceed * 100 +
        "%"
    } else if (currentMenu.type === "info") {
      info =
        "\n" +
        group(currentMenu.info, 2)
          .map((group) =>
            group.map((stat) => rightPad(upperFirst(stat), 10)).join(" | ")
          )
          .join("\n")
    }
  }

  return renderedMenu + verticalClearance + info
}

const selectedMenu = (string: string) =>
  textFormat.green(">" + textFormat.underline(string))
const selectableMenu = (string: string) => " " + string
const upperFirst = (string: string) =>
  string[0].toLocaleUpperCase() + string.slice(1)
const group = <T>(array: Array<T>, size: number): Array<Array<T>> => {
  let currentSize = size
  let index = 0
  return array.reduce((acc, current) => {
    acc[index] = (acc[index] ?? []).concat([current])
    currentSize--
    if (currentSize === 0) {
      index++
    }
    return acc
  }, [])
}

const getTextAnimationRender = ({
  startedAt,
  text,
  textSpeed,
}: typeof gameState["textAnimation"]) => {
  if (startedAt) {
    const characterCount = (Date.now() - startedAt) / textSpeed
    return selectText(text, characterCount) + "▎"
  }
  return ""
}

export const formatFractional = (number: number, digits: number) => {
  const [integers, fractionals] = String(number).split(".")
  if (!fractionals) return String(number)

  const significantFractionals = ignoreTrailingZeros(
    fractionals.slice(0, digits)
  )

  return significantFractionals.split("").every((digit) => digit === "0")
    ? integers
    : [integers, significantFractionals].join(".")
}

const ignoreTrailingZeros = (string: string) => {
  let reverseResult = ""
  for (let index = string.length - 1; index >= 0; index--) {
    if (string[index] === "0" && reverseResult) {
      reverseResult += string[index]
    } else if (string[index] !== "0") {
      reverseResult += string[index]
    }
  }

  return reverse(reverseResult)
}

const reverse = (string: string): string => {
  let result = ""
  for (let index = string.length - 1; index >= 0; index--) {
    result += string[index]
  }
  return result
}
