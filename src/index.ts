import { selectMenu, getMenu } from "./menu"
import { gameState, getStats } from "./gameState"
import { sleep } from "./util"
import { getClearRender, render } from "./render"
import "./input"

const run = async () => {
  gameState.width = 36
  gameState.height = 13

  gameState.enemy.concat(gameState.me).forEach((player) => {
    player.currentStats = getStats(player)
  })
  gameState.menu = getMenu(
    gameState.me[0],
    gameState.me.concat(gameState.enemy)
  )

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
