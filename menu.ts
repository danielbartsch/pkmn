import * as textFormat from "./textFormat"

export type Attack = {
  label: string
  key: string
  type: "action"
  damage: number
  chanceToSucceed: number
  chanceToCritical: number
}

type MenuElement = {
  label: string
  key: string
} & ({ type: "menu" | "setting" } | Attack)
export type Menu = [MenuElement, Array<Menu>] | MenuElement

export const attacks: Array<Attack> = [
  {
    label: "Tackle",
    key: "tackle",
    type: "action",
    damage: 10,
    chanceToSucceed: 0.9,
    chanceToCritical: 0.05,
  },
  {
    label: "Harden",
    key: "harden",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
  },
  {
    label: "Miss",
    key: "miss",
    type: "action",
    damage: 0,
    chanceToSucceed: 0,
    chanceToCritical: 0,
  },
  {
    label: "Crit",
    key: "crit",
    type: "action",
    damage: 20,
    chanceToSucceed: 1,
    chanceToCritical: 1,
  },
]

export const menu: Array<Menu> = [
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
      [
        { label: "Text color", key: "textcolor", type: "menu" },
        [
          { label: "Green", key: "green", type: "setting" },
          { label: "White", key: "white", type: "setting" },
          { label: "Black", key: "black", type: "setting" },
          { label: "Yellow", key: "yellow", type: "setting" },
        ],
      ],
    ],
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
  if (
    !Array.isArray(currentMenu) &&
    currentMenu.key !== "flee" &&
    currentMenu.type === "action"
  ) {
    process.stdout.write(
      "\n\n Damage   " +
        currentMenu.damage +
        "\n Accuracy " +
        currentMenu.chanceToSucceed * 100 +
        "%\n"
    )
  }
}

export const selectMenu = (
  menu: Array<Menu>,
  selected: Array<number>
): Array<Menu> =>
  selected.slice(0, -1).reduce((acc, selectedIndex) => {
    const nextMenu = acc[selectedIndex]
    return Array.isArray(nextMenu) ? nextMenu[1] : nextMenu
  }, menu) as any
