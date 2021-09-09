import { selectMenu, updateFightersData } from "./menu"
import { gameState } from "./gameState"
import { sleep } from "./util"
import { getClearRender, render } from "./render"
import "./input"

const run = async () => {
  gameState.width = 36
  gameState.height = 13

  updateFightersData({ restartLife: true })

  process.stdout.write(
    getClearRender({
      height: process.stdout.rows,
      width: process.stdout.columns,
    })
  )
  while (true) {
    render(
      selectMenu(gameState.menu, gameState.selected),
      gameState.selected[gameState.selected.length - 1]
    )
    await sleep(16)
  }
}

run()
