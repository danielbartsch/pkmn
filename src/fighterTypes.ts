export type FighterType = {
  name: string
  baseStats: Stats
}

export type Stats = {
  // values 0 to 10
  life: number
  attack: number
  defense: number
  speed: number
}

export const fighterTypes = {
  attacker: {
    name: "Attacker",
    baseStats: {
      life: 3,
      attack: 5,
      defense: 3,
      speed: 2,
    },
  },
  defender: {
    name: "Defender",
    baseStats: {
      life: 3,
      attack: 3,
      defense: 5,
      speed: 2,
    },
  },
  weakDefender: {
    name: "Weak Defender",
    baseStats: {
      life: 4,
      attack: 2,
      defense: 4,
      speed: 3,
    },
  },
  strongAttacker: {
    name: "Strong Attacker",
    baseStats: {
      life: 2,
      attack: 7,
      defense: 2,
      speed: 2,
    },
  },
} as const
