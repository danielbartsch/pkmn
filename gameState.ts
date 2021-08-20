export type Player = {
  life: number
  lifeMax: number
  lifeBarAnimation: {
    startedAt: number | null
    from: number | null
    duration: number
  }
}

type GameState = {
  enemy: Player
  me: Player
  ownTurn: boolean
  selected: Array<number>
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
  },
  me: {
    life: 100,
    lifeMax: 100,
    lifeBarAnimation: {
      startedAt: null,
      from: null,
      duration: 1000,
    },
  },
  ownTurn: true,
  selected: [0],
  textAnimation: {
    startedAt: null,
    text: "",
    textSpeed: 50, // one character every <this value> milliseconds
    textColor: "white",
  },

  log: [],
}