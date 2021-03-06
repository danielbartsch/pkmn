import { attackTypes } from "./attackTypes"
import { Stats, FighterType, fighterTypes } from "./fighterTypes"
import { Attack, Menu } from "./menu"

export type Status = {
  change: "attack" | "defense" | "speed"
  severity: number
}

export type Fighter = {
  type: FighterType
  level: number
  currentStats: Stats
  statusEffects: Array<Status>
  attacks: [Attack, Attack, Attack, Attack]
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
  }
  menu: Array<Menu>
  width: number
  height: number
  log: Array<any>
}

export const getStats = (fighter: Fighter): Stats => ({
  life: fighter.level * fighter.type.baseStats.life,
  attack: fighter.level * fighter.type.baseStats.attack,
  defense: fighter.level * fighter.type.baseStats.defense,
  speed: fighter.level * fighter.type.baseStats.speed,
})

export const gameState: GameState = {
  enemy: [
    {
      type: fighterTypes.attacker,
      level: 5,
      currentStats: {
        life: 0,
        attack: 0,
        defense: 0,
        speed: 0,
      },
      attacks: [
        attackTypes.tackle,
        attackTypes.dragonDance,
        attackTypes.growl,
        attackTypes.crit,
      ],
      statusEffects: [],
      lifeBarAnimation: {
        startedAt: null,
        from: null,
        duration: 1000,
      },
    },
    {
      type: fighterTypes.strongAttacker,
      level: 5,
      currentStats: {
        life: 0,
        attack: 0,
        defense: 0,
        speed: 0,
      },
      attacks: [
        attackTypes.tackle,
        attackTypes.dragonDance,
        attackTypes.swordsDance,
        attackTypes.crit,
      ],
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
      type: fighterTypes.defender,
      level: 5,
      currentStats: {
        life: 0,
        attack: 0,
        defense: 0,
        speed: 0,
      },
      attacks: [
        attackTypes.tackle,
        attackTypes.dragonDance,
        attackTypes.growl,
        attackTypes.harden,
      ],
      statusEffects: [],
      lifeBarAnimation: {
        startedAt: null,
        from: null,
        duration: 1000,
      },
    },
    {
      type: fighterTypes.weakDefender,
      level: 5,
      currentStats: {
        life: 0,
        attack: 0,
        defense: 0,
        speed: 0,
      },
      attacks: [
        attackTypes.tackle,
        attackTypes.dragonDance,
        attackTypes.growl,
        attackTypes.crit,
      ],
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
  },
  menu: [],
  width: 10,
  height: 10,

  log: [],
}
