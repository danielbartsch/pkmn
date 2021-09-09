import { Fighter, gameState, getStats, Status } from "./gameState"
import { formatFractional } from "./render"
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

const getMenu = (
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
          rightPad(key, 7) +
          " " +
          formatFractional(fighter.currentStats[key], 1)
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

export const selectMenu = (
  menu: Array<Menu>,
  selected: Array<number>
): Array<Menu> =>
  selected.slice(0, -1).reduce((acc, selectedIndex) => {
    const nextMenu = acc[selectedIndex]
    return Array.isArray(nextMenu) ? nextMenu[1] : nextMenu
  }, menu) as any

export const updateFightersData = ({
  restartLife,
}: {
  restartLife: boolean
}) => {
  gameState.enemy.concat(gameState.me).forEach((player) => {
    const life = player.currentStats.life
    player.currentStats = getStats(player)
    if (!restartLife) player.currentStats.life = life
  })
  gameState.menu = getMenu(
    gameState.me[0],
    gameState.me.concat(gameState.enemy)
  )
}
