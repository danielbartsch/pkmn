import * as textFormat from "./textFormat"

export const renderLifeBar = ({
  width,
  current,
  max,
}: {
  width: number
  current: number
  max: number
}) => {
  const lifePercentage = current / max
  const lifeRemainingRelative = lifePercentage * width
  const format =
    lifePercentage < 0.125
      ? textFormat.red
      : lifePercentage < 0.5
      ? textFormat.yellow
      : textFormat.green

  process.stdout.write(
    format(
      "█".repeat(Math.floor(lifeRemainingRelative)) +
        getFractionLifeBar(
          Math.ceil(lifeRemainingRelative) - lifeRemainingRelative
        )
    ) + "\n"
  )
}

const getFractionLifeBar = (fraction) => {
  if (fraction === 0) return ""
  if (fraction < 0.125) return "█"
  if (fraction < 0.25) return "▉"
  if (fraction < 0.375) return "▊"
  if (fraction < 0.5) return "▋"
  if (fraction < 0.625) return "▌"
  if (fraction < 0.75) return "▍"
  if (fraction < 0.875) return "▎"
  if (fraction < 1) return "▏"
  return " "
}
