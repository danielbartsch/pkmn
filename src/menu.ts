import { Fighter, Status } from "./gameState"
import * as textFormat from "./textFormat"

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

export const attacks: Array<Attack> = [
  {
    label: "Tackle",
    key: "tackle",
    type: "action",
    damage: 5,
    chanceToSucceed: 0.95,
    chanceToCritical: 0.05,
  },
  {
    label: "Harden",
    key: "harden",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "me", change: "defense", severity: 1 }],
  },
  /*{
    label: "Growl",
    key: "growl",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "enemy", change: "attack", severity: -1 }],
  },*/
  {
    label: "Dragon Dance",
    key: "dragondance",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "me", change: "speed", severity: 1 }],
  },
  {
    label: "Crit",
    key: "crit",
    type: "action",
    damage: 4.5,
    chanceToSucceed: 0.85,
    chanceToCritical: 0.4,
  },
]

export const getMenu = (fighters: Array<Fighter>): Array<Menu> => [
  [{ label: "Attack", key: "attack", type: "menu" }, attacks],
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
]

const selectedMenu = (string: string) =>
  textFormat.green(">" + textFormat.underline(string))
const selectableMenu = (string: string) => textFormat.white(" " + string)
export const renderMenu = (menu: Array<Menu>, selected: number) => {
  process.stdout.write(
    menu
      .map((name, index) => {
        const format = index === selected ? selectedMenu : selectableMenu
        return format(Array.isArray(name) ? name[0].label : name.label)
      })
      .join(" ")
  )

  const currentMenu = menu[selected]
  if (!Array.isArray(currentMenu)) {
    if (currentMenu.key !== "flee" && currentMenu.type === "action") {
      process.stdout.write(
        "\n\n Damage   " +
          currentMenu.damage +
          "\n Accuracy " +
          currentMenu.chanceToSucceed * 100 +
          "%\n"
      )
    } else if (currentMenu.type === "info") {
      process.stdout.write(
        "\n\n" +
          group(currentMenu.info, 2)
            .map((group) =>
              group.map((stat) => rightPad(upperFirst(stat), 10)).join(" | ")
            )
            .join("\n")
      )
    }
  }
}

const rightPad = (string: string, pad: number) => {
  if (string.length > pad) {
    return string
  }
  return string + " ".repeat(pad - string.length)
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
