import { animateText } from "./animateText"
import { gameState, Fighter, Status } from "./gameState"
import { Attack } from "./menu"
import { formatFractional } from "./render"
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

const statusEffectChangeLabel: Record<
  Fighter["statusEffects"][0]["change"],
  string
> = {
  attack: "Attack",
  defense: "Defense",
  speed: "Speed",
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

    target.currentStats.life -= Math.ceil(
      (isCritical ? 2 : 1) *
        menuEntry.damage *
        defenseAttackRelation *
        variancePercent()
    )

    if (target.currentStats.life <= 0) {
      target.currentStats.life = 0
    }

    const statusEffectInfo: Array<string> = []
    menuEntry.statusEffects?.forEach(
      ({ change, severity, target: statusEffectTarget }) => {
        const fighter = statusEffectTarget === "enemy" ? target : actor
        if (Math.abs(sumStatusEffects(fighter.statusEffects, change)) === 6) {
          statusEffectInfo.push(
            `${statusEffectChangeLabel[change]} of ${
              fighter.type.name
            } cannot be ${
              severity < 0 ? "decreased" : "increased"
            } any further.`
          )
        } else {
          fighter.statusEffects.push({
            change,
            severity,
          })
        }
      }
    )

    if (statusEffectInfo.length > 0) {
      await animateText(statusEffectInfo.join("\n"))
    }

    if (menuEntry.damage !== 0) {
      await sleep(target.lifeBarAnimation.duration)
    }
    if (isCritical) {
      await animateText("Critical hit!")
    }
  } else {
    await animateText(textFormat.blue(menuEntry.label) + " missed!")
  }
}

export const round = async (menuEntry: Attack) => {
  gameState.lastSelected = gameState.selected
  gameState.ownTurn = false
  gameState.selected = [gameState.lastSelected[0]]

  const actions = {
    meAction: async (): Promise<"defeat" | "no defeat"> => {
      if (menuEntry.key === "flee") {
        if (Math.random() < menuEntry.chanceToSucceed) {
          await animateText(textFormat.green("You") + " fled!")
          process.exit(0)
        } else {
          await animateText("Couldn't flee.")
        }
      } else {
        await animateText(
          textFormat.green(gameState.me[0].type.name) +
            " uses " +
            textFormat.blue(menuEntry.label) +
            "."
        )
        await attack(menuEntry, gameState.me[0], gameState.enemy[0])
      }

      if (gameState.enemy[0].currentStats.life <= 0) {
        gameState.ownTurn = false
        const fractionalLevelIncrease = getFractionLevelIncrease(
          gameState.me[0],
          gameState.enemy[0]
        )
        gameState.me[0].level += fractionalLevelIncrease
        await defeat(
          gameState.me[0],
          gameState.enemy,
          fractionalLevelIncrease,
          true
        )
        return "defeat"
      }
      return "no defeat"
    },
    enemyAction: async (): Promise<"defeat" | "no defeat"> => {
      const enemyMenuEntry =
        gameState.enemy[0].attacks[
          Math.floor(Math.random() * gameState.enemy[0].attacks.length)
        ]
      await animateText(
        textFormat.red(gameState.enemy[0].type.name) +
          " uses " +
          textFormat.blue(enemyMenuEntry.label) +
          "."
      )
      await attack(enemyMenuEntry, gameState.enemy[0], gameState.me[0])

      if (gameState.me[0].currentStats.life <= 0) {
        const fractionalLevelIncrease = getFractionLevelIncrease(
          gameState.enemy[0],
          gameState.me[0]
        )
        gameState.enemy[0].level += fractionalLevelIncrease
        await defeat(
          gameState.enemy[0],
          gameState.me,
          fractionalLevelIncrease,
          false
        )
        return "defeat"
      }
      return "no defeat"
    },
  }

  const actionOrder = getActionOrder(
    sumStatusEffects(gameState.me[0].statusEffects, "speed"),
    sumStatusEffects(gameState.enemy[0].statusEffects, "speed")
  )

  if ((await actions[actionOrder[0]]()) === "no defeat") {
    await actions[actionOrder[1]]()
  }

  gameState.ownTurn = true
}

const getFractionLevelIncrease = (
  defeater: Fighter,
  defeated: Fighter
): number => defeated.level / defeater.level / 5

function getActionOrder(
  meSpeed: number,
  enemySpeed: number
): ["meAction" | "enemyAction", "meAction" | "enemyAction"] {
  if (meSpeed > enemySpeed) return ["meAction", "enemyAction"]
  if (meSpeed < enemySpeed) return ["enemyAction", "meAction"]
  if (Math.random() < 0.5) return ["meAction", "enemyAction"]
  else return ["enemyAction", "meAction"]
}

const defeat = async (
  defeater: Fighter,
  fighters: Array<Fighter>,
  fractionalLevelIncrease: number,
  isEnemy: boolean
) => {
  const defeatedTextFormat = isEnemy ? textFormat.red : textFormat.green
  const defeaterTextFormat = isEnemy ? textFormat.green : textFormat.red

  await animateText(`${defeatedTextFormat(fighters[0].type.name)} is defeated.`)
  await animateText(
    `${defeaterTextFormat(defeater.type.name)} levels up ${formatFractional(
      fractionalLevelIncrease,
      2
    )}`
  )
  if (fighters.every((fighter) => fighter.currentStats.life === 0)) {
    if (isEnemy) {
      await animateText(
        textFormat.red("Enemy") +
          " has no more fighters.\0\0\0\0\0\0\0\n" +
          textFormat.green("You") +
          " won!"
      )
    } else {
      await animateText(
        textFormat.green("You") +
          " have no more fighters.\0\0\0\0\0\0\0\n" +
          textFormat.red("Enemy") +
          " won!"
      )
    }
    process.exit(0)
  } else {
    await animateText(
      defeatedTextFormat(fighters[1].type.name) + " joins the fight."
    )
    const defeatedFighter = fighters.shift()
    fighters.push(defeatedFighter)
  }
}
