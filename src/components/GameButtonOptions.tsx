import { useId } from "react"

const RED_BALL_OPTIONS = [3, 6, 15] as const
const RACE_TO_OPTIONS = [3, 5] as const

type RadioButtonsProps = {
  readonly selectedValue: number
  readonly onChange: (value: number) => void
}

export function RedBallButtons({ selectedValue, onChange }: RadioButtonsProps) {
  const name = useId()

  return (
    <div className="flex gap-1 justify-center h-6">
      {RED_BALL_OPTIONS.map((reds) => {
        const isSelected = selectedValue === reds
        return (
          <label
            key={reds}
            className={`w-6 h-6 flex items-center justify-center bg-gunmetal/30 backdrop-blur-sm border rounded text-xs transition-colors cursor-pointer ${
              isSelected
                ? "border-red-500 text-red-400"
                : "border-gunmetal text-gray-300 hover:border-red-500 hover:text-red-400"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={reds}
              checked={isSelected}
              onChange={() => onChange(reds)}
              className="sr-only"
              aria-label={`Snooker with ${reds} red balls`}
            />
            {reds}
          </label>
        )
      })}
    </div>
  )
}

export function RaceToButtons({ selectedValue, onChange }: RadioButtonsProps) {
  const name = useId()

  return (
    <div className="flex gap-1 justify-center h-6">
      {RACE_TO_OPTIONS.map((raceTo) => {
        const isSelected = selectedValue === raceTo
        return (
          <label
            key={raceTo}
            className={`px-1.5 h-6 flex items-center justify-center bg-gunmetal/30 backdrop-blur-sm border rounded text-xs transition-colors cursor-pointer ${
              isSelected
                ? "border-yellow-500 text-yellow-400"
                : "border-gunmetal text-gray-300 hover:border-yellow-500 hover:text-yellow-400"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={raceTo}
              checked={isSelected}
              onChange={() => onChange(raceTo)}
              className="sr-only"
              aria-label={`Race to ${raceTo}`}
            />
            To:{raceTo}
          </label>
        )
      })}
    </div>
  )
}

export function ButtonOptionsPlaceholder() {
  return <div className="h-6" />
}
