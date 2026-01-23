import { StarIcon as SolidStarIcon } from "@heroicons/react/24/solid"
import { StarIcon as OutlineStarIcon } from "@heroicons/react/24/outline"
import { useState } from "react"

export function Star() {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    window.open("https://github.com/tailuge/billiards", "_blank", "noopener,noreferrer")
    setClicked(true)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Star the repository on GitHub (opens in a new tab)"
      title="Star the repository on GitHub (opens in a new tab)"
      className={`star-button ${clicked ? "star-button--clicked" : "star-button--unclicked"}`}
    >
      {clicked ? (
        <SolidStarIcon className="star-icon" />
      ) : (
        <OutlineStarIcon className="star-icon star-icon--outline" />
      )}
    </button>
  )
}
