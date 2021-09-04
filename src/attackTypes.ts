import { Attack } from "./menu"

// needed to infer object keys type-wise
const createAttackTypes = <T extends Record<string, Attack>>(types: T) => types

export const attackTypes = createAttackTypes({
  tackle: {
    label: "Tackle",
    key: "tackle",
    type: "action",
    damage: 5,
    chanceToSucceed: 0.95,
    chanceToCritical: 0.05,
  },
  harden: {
    label: "Harden",
    key: "harden",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "me", change: "defense", severity: 1 }],
  },
  growl: {
    label: "Growl",
    key: "growl",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "enemy", change: "attack", severity: -1 }],
  },
  dragonDance: {
    label: "Dragon Dance",
    key: "dragondance",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "me", change: "speed", severity: 1 }],
  },
  swordsDance: {
    label: "Swords Dance",
    key: "swordsDance",
    type: "action",
    damage: 0,
    chanceToSucceed: 1,
    chanceToCritical: 0,
    statusEffects: [{ target: "me", change: "attack", severity: 2 }],
  },
  crit: {
    label: "Crit",
    key: "crit",
    type: "action",
    damage: 4.5,
    chanceToSucceed: 0.85,
    chanceToCritical: 0.4,
  },
})
