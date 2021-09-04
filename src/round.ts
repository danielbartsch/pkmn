import { animateText } from "./animateText"
import { gameState, Fighter, Status } from "./gameState"
import { Attack } from "./menu"
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

const attack = async (menuEntry: Attack, actor: Fighter, target: Fighter) => {
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
    const defenseAttackRelation =
      (actor.currentStats.attack * actorStatusEffects) /
      (target.currentStats.defense * targetStatusEffects)

    target.currentStats.life -= Math.round(
      (isCritical ? 2 : 1) *
        menuEntry.damage *
        defenseAttackRelation *
        variancePercent()
    )

    if (target.currentStats.life <= 0) {
      target.currentStats.life = 0
    }

    menuEntry.statusEffects?.forEach(
      ({ change, severity, target: statusEffectTarget }) => {
        const fighter = statusEffectTarget === "enemy" ? target : actor
        fighter.statusEffects.push({
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
        await animateText(
          gameState.me[0].type.name + " uses " + menuEntry.label + "."
        )
        await attack(menuEntry, gameState.me[0], gameState.enemy[0])
      }

      if (gameState.enemy[0].currentStats.life <= 0) {
        gameState.ownTurn = false
        await defeat(gameState.enemy, true)
      }
    },
    enemyAction: async () => {
      const enemyMenuEntry =
        gameState.enemy[0].attacks[
          Math.floor(Math.random() * gameState.enemy[0].attacks.length)
        ]
      await animateText(
        gameState.enemy[0].type.name +
          " (enemy) uses " +
          enemyMenuEntry.label +
          "."
      )
      await attack(enemyMenuEntry, gameState.enemy[0], gameState.me[0])

      if (gameState.me[0].currentStats.life <= 0) {
        await defeat(gameState.me, false)
      }
    },
  }

  const actionOrder = getActionOrder(
    sumStatusEffects(gameState.me[0].statusEffects, "speed"),
    sumStatusEffects(gameState.enemy[0].statusEffects, "speed")
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

const defeat = async (fighters: Array<Fighter>, isEnemy: boolean) => {
  await animateText(
    `${fighters[0].type.name}${isEnemy ? " (enemy)" : ""} is defeated.`
  )
  if (fighters.every((fighter) => fighter.currentStats.life === 0)) {
    if (isEnemy) {
      await animateText(
        "Enemy has no more fighters.\0\0\0\0\0\0\0\n" +
          textFormat.green("You won!")
      )
    } else {
      await animateText(
        "You have no more fighters.\0\0\0\0\0\0\0\n" +
          textFormat.red("Enemy won!")
      )
    }
    process.exit(0)
  } else {
    await animateText(fighters[1].type.name + " joins the fight.")
    const defeatedFighter = fighters.shift()
    fighters.push(defeatedFighter)
  }
}
