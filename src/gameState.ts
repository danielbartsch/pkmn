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

export type Fighter = {
  name: string
  level: number
  currentStats: Stats
  baseStats: Stats
  statusEffects: Array<Status>
  lifeBarAnimation: {
    startedAt: number | null
    from: number | null
    duration: number
  }
}

type GameState = {
  enemy: Fighter
  me: Fighter
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
  life: fighter.level * fighter.baseStats.life,
  attack: fighter.level * fighter.baseStats.attack,
  defense: fighter.level * fighter.baseStats.defense,
  speed: fighter.level * fighter.baseStats.speed,
})

export const gameState: GameState = {
  enemy: {
    name: "Apedt",
    level: 5,
    currentStats: {
      life: 0,
      attack: 0,
      defense: 0,
      speed: 0,
    },
    baseStats: {
      life: 3,
      attack: 5,
      defense: 3,
      speed: 2,
    },
    statusEffects: [],
    lifeBarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
  },
  me: {
    name: "Yogda",
    level: 5,
    currentStats: {
      life: 0,
      attack: 0,
      defense: 0,
      speed: 0,
    },
    baseStats: {
      life: 3,
      attack: 3,
      defense: 5,
      speed: 2,
    },
    statusEffects: [],
    lifeBarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
  },
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
