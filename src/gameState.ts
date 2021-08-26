export type Status = {
  change: "attack" | "defense" | "speed"
  severity: number
}

export type Player = {
  life: number
  lifeBarAnimation: {
    startedAt: number | null
    from: number | null
    duration: number
  }
  baseStats: {
    life: number
    attack: number
    defense: number
    speed: number
  }
  statusEffects: Array<Status>
}

type GameState = {
  enemy: Player
  me: Player
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

export const gameState: GameState = {
  enemy: {
    life: 20,
    baseStats: {
      life: 20,
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
    life: 20,
    baseStats: {
      life: 20,
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
