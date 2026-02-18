import { useId } from "react"

interface BallIconProps {
  readonly number?: number
  readonly solidColor?: "red" | "yellow"
  readonly size?: number
  readonly className?: string
}

const BALL_COLORS: Record<number, string> = {
  1: "#F9D71C",
  2: "#005596",
  3: "#E31D2D",
  4: "#4B2D83",
  5: "#F78F1E",
  6: "#008C45",
  7: "#8B4513",
  8: "#1a1a1a",
  9: "#F9D71C",
  10: "#005596",
  11: "#E31D2D",
  12: "#4B2D83",
  13: "#F78F1E",
  14: "#008C45",
  15: "#8B4513",
}

const SOLID_COLORS: Record<NonNullable<BallIconProps["solidColor"]>, string> = {
  red: "#E31D2D",
  yellow: "#F9D71C",
}

export function BallIcon({
  number,
  solidColor,
  size = 48,
  className,
}: BallIconProps) {
  const uniqueId = useId()
  const normalizedNumber =
    typeof number === "number" && number >= 1 && number <= 15 ? number : 8
  const fillColor = solidColor
    ? SOLID_COLORS[solidColor]
    : (BALL_COLORS[normalizedNumber] ?? "#ccc")
  const isStriped = !solidColor && normalizedNumber >= 9
  const showNumber = !solidColor
  const uniqueSeed = solidColor
    ? `solid-${solidColor}`
    : `num-${normalizedNumber}`
  const gradId = `rimGrad-${uniqueSeed}-${uniqueId}`
  const maskId = `ballMask-${uniqueSeed}-${uniqueId}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={maskId}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="55%" stopColor="black" stopOpacity={0} />
          <stop offset="100%" stopColor="black" stopOpacity={0.35} />
        </radialGradient>
      </defs>

      {isStriped ? (
        <>
          <circle cx="50" cy="50" r="48" fill="#ffffff" />
          <g clipPath={`url(#${maskId})`}>
            <path
              d="M-5 35 Q50 20 105 35 L105 65 Q50 80 -5 65 Z"
              fill={fillColor}
            />
          </g>
        </>
      ) : (
        <circle cx="50" cy="50" r="48" fill={fillColor} />
      )}

      <circle cx="50" cy="50" r="48" fill={`url(#${gradId})`} />
      <circle cx="30" cy="30" r="10" fill="white" fillOpacity={0.2} />

      {showNumber && (
        <>
          <circle cx="50" cy="50" r="19" fill="white" />
          <text
            x="50"
            y="52"
            fontFamily="Arial, sans-serif"
            fontSize="32"
            fontWeight="900"
            fill="black"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {normalizedNumber}
          </text>
        </>
      )}
    </svg>
  )
}

export default BallIcon
