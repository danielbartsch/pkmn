import { selectMenu, updateFightersData } from "./menu"
import { gameState } from "./gameState"
import { sleep } from "./util"
import { getClearRender, render } from "./render"
import "./input"
import { readFighters } from "./save"

const run = async () => {
  gameState.width = 36
  gameState.height = 13

  const saved = await readFighters()
  gameState.me = saved.me
  gameState.enemy = saved.enemy

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
