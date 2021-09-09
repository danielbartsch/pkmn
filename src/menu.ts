import { wrapText } from "./animateText"
import { Fighter, gameState, Status } from "./gameState"
import * as textFormat from "./textFormat"
import { rightPad } from "./util"

export type Attack = {
  label: string
  key: string
  type: "action"
  damage: number
  chanceToSucceed: number
  chanceToCritical: number
  statusEffects?: Array<Status & { target: "me" | "enemy" }>
}

export type Info = {
  label: string
  key: string
  type: "info"
  info: Array<string>
}

type MenuElement = {
  label: string
  key: string
} & ({ type: "menu" | "setting" } | Attack | Info)
export type Menu = [MenuElement, Array<Menu>] | MenuElement

export const getMenu = (
  currentFighter: Fighter,
  fighters: Array<Fighter>
): Array<Menu> => [
  [{ label: "Attack", key: "attack", type: "menu" }, currentFighter.attacks],
  [
    { label: "Inspect", key: "inspect", type: "menu" },
    fighters.map((fighter) => ({
      label: fighter.type.name,
      key: fighter.type.name,
      type: "info",
      info: Object.keys(fighter.currentStats).map(
        (key: keyof typeof fighter.currentStats) =>
          rightPad(key, 7) + " " + fighter.currentStats[key]
      ),
    })),
  ],
  {
    label: "Flee",
    key: "flee",
    type: "action",
    damage: 0,
    chanceToSucceed: 0.5,
    chanceToCritical: 0,
  },
  [
    { label: "Settings", key: "settings", type: "menu" },
    [
      [
        { label: "Text speed", key: "textspeed", type: "menu" },
        [
          { label: "Slow", key: "slow", type: "setting" },
          { label: "Normal", key: "normal", type: "setting" },
          { label: "Fast", key: "fast", type: "setting" },
        ],
      ],
    ],
  ],
]

const selectedMenu = (string: string) =>
  textFormat.green(">" + textFormat.underline(string))
const selectableMenu = (string: string) => " " + string
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

export const selectMenu = (
  menu: Array<Menu>,
  selected: Array<number>
): Array<Menu> =>
  selected.slice(0, -1).reduce((acc, selectedIndex) => {
    const nextMenu = acc[selectedIndex]
    return Array.isArray(nextMenu) ? nextMenu[1] : nextMenu
  }, menu) as any
