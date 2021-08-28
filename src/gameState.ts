export type Status = {
  change: "attack" | "defense" | "speed"
  severity: number
}

type Stats = {
  // values 0 to 10
  life: number
  attack: number
  defense: number
  speed: number
}

type FighterType = {
  name: string
  baseStats: Stats
}

export type Fighter = {
  type: FighterType
  level: number
  currentStats: Stats
  statusEffects: Array<Status>
  lifeBarAnimation: {
    startedAt: number | null
    from: number | null
    duration: number
  }
}

type GameState = {
  enemy: Array<Fighter> // first one is currently fighting
  me: Array<Fighter> // first one is currently fighting
  ownTurn: boolean
  selected: Array<number>
  lastSelected: Array<number>
  textAnimation: {
    startedAt: number | null
    text: string
    textSpeed: number
    textColor: "white" | "green" | "black" | "yellow"
  }
  log: Array<any>
}

export const getStats = (fighter: Fighter): Stats => ({
  life: fighter.level * fighter.type.baseStats.life,
  attack: fighter.level * fighter.type.baseStats.attack,
  defense: fighter.level * fighter.type.baseStats.defense,
  speed: fighter.level * fighter.type.baseStats.speed,
})

const fighterType: Record<string, FighterType> = {
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
}

export const gameState: GameState = {
  enemy: [
    {
      type: fighterType.apedt,
      level: 5,
      currentStats: {
        life: 0,
        attack: 0,
        defense: 0,
        speed: 0,
      },
      statusEffects: [],
      lifeBarAnimation: {
        startedAt: null,
        from: null,
        duration: 1000,
      },
    },
  ],
  me: [
    {
      type: fighterType.yogda,
      level: 5,
      currentStats: {
        life: 0,
        attack: 0,
        defense: 0,
        speed: 0,
      },
      statusEffects: [],
      lifeBarAnimation: {
        startedAt: null,
        from: null,
        duration: 1000,
      },
    },
  ],
  ownTurn: true,
  selected: [0],
  lastSelected: [],
  textAnimation: {
    startedAt: null,
    text: "",
    textSpeed: 50, // one character every <this value> milliseconds
    textColor: "white",
  },

  log: [],
}
