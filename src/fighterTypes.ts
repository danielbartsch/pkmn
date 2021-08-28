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
  apedt: {
    name: "Apedt",
    baseStats: {
      life: 3,
      attack: 5,
      defense: 3,
      speed: 2,
    },
  },
  yogda: {
    name: "Yogda",
    baseStats: {
      life: 3,
      attack: 3,
      defense: 5,
      speed: 2,
    },
  },
  linvag: {
    name: "Linvag",
    baseStats: {
      life: 4,
      attack: 2,
      defense: 4,
      speed: 3,
    },
  },
  enbor: {
    name: "Enbor",
    baseStats: {
      life: 2,
      attack: 7,
      defense: 2,
      speed: 2,
    },
  },
} as const
