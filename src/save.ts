import { Fighter, gameState } from "./gameState"

const fs = require("fs")
export const saveFighters = () =>
  new Promise((resolve, reject) =>
    fs.writeFile(
      "./save.json",
      JSON.stringify({
        enemy: gameState.enemy.map(saveFighter),
        me: gameState.me.map(saveFighter),
      }),
      (err: Error) => {
        if (err) {
          console.error(err)

          reject(err)
          return
        }
        resolve(undefined)
      }
    )
  )

export const readFighters = (): Promise<
  Pick<typeof gameState, "enemy" | "me">
> =>
  new Promise((resolve) =>
    fs.readFile("./save.json", "utf8", (err: Error, data: string) => {
      if (err) {
        console.error(err)
        resolve({
          me: gameState.me,
          enemy: gameState.enemy,
        })
        return
      }
      resolve(JSON.parse(data))
    })
  )

const saveFighter = (fighter: Fighter): Fighter => ({
  ...fighter,
  statusEffects: [],
})
