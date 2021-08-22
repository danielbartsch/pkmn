export type Status = {
  change: "attack" | "defense"
  severity: number
}

export type Player = {
  life: number
  lifeMax: number
  lifeBarAnimation: {
    startedAt: number | null
    from: number | null
    duration: number
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
    life: 100,
    lifeMax: 100,
    lifeBarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
    statusEffects: [],
  },
  me: {
    life: 100,
    lifeMax: 100,
    lifeBarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
    statusEffects: [],
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
