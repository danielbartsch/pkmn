import { animateText } from "./animateText"
import { gameState, Player, Status } from "./gameState"
import { Attack, attacks } from "./menu"
import * as textFormat from "./textFormat"
import { sleep } from "./util"

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

export const sumStatusEffects = (
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

// variance = 0.1 --> returns between 0.95 and 1.05
const variancePercent = (variance = 0.2) =>
  Math.random() * variance + (1 - variance / 2)

const attack = async (menuEntry: Attack, actor: Player, target: Player) => {
  if (Math.random() < menuEntry.chanceToSucceed) {
    const isCritical = Math.random() < menuEntry.chanceToCritical

    target.lifeBarAnimation.from = target.currentStats.life
    target.lifeBarAnimation.startedAt = Date.now()

    const targetStatusEffects =
      statusEffectAttackMultipliers[
        sumStatusEffects(target.statusEffects, "defense")
      ]
    const actorStatusEffects =
      statusEffectAttackMultipliers[
        sumStatusEffects(actor.statusEffects, "attack")
      ]

    target.currentStats.life -= Math.round(
      (isCritical ? 2 : 1) *
        menuEntry.damage *
        targetStatusEffects *
        actorStatusEffects *
        variancePercent()
    )

    if (target.currentStats.life <= 0) {
      target.currentStats.life = 0
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

export const round = async (menuEntry: Attack) => {
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

      if (gameState.enemy.currentStats.life <= 0) {
        gameState.ownTurn = false
        await animateText(
          "Enemy cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
            textFormat.green("You won!")
        )
        process.exit(0)
      }
    },
    enemyAction: async () => {
      const enemyMenuEntry = attacks[Math.floor(Math.random() * attacks.length)]
      await animateText("Enemy uses " + enemyMenuEntry.label + ".")
      await attack(enemyMenuEntry, gameState.enemy, gameState.me)

      if (gameState.me.currentStats.life <= 0) {
        await animateText(
          "You cannot fight anymore.\0\0\0\0\0\0\0\0\0\n" +
            textFormat.red("You lost!")
        )
        process.exit(0)
      }
    },
  }

  const actionOrder = getActionOrder(
    sumStatusEffects(gameState.me.statusEffects, "speed"),
    sumStatusEffects(gameState.enemy.statusEffects, "speed")
  )

  await actions[actionOrder[0]]()
  await actions[actionOrder[1]]()

  gameState.ownTurn = true
}

function getActionOrder(
  meSpeed: number,
  enemySpeed: number
): ["meAction" | "enemyAction", "meAction" | "enemyAction"] {
  if (meSpeed > enemySpeed) return ["meAction", "enemyAction"]
  if (meSpeed < enemySpeed) return ["enemyAction", "meAction"]
  if (Math.random() < 0.5) return ["meAction", "enemyAction"]
  else return ["enemyAction", "meAction"]
}
