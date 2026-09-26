export interface WaterDay {
  date: string
  entriesMl: number[]
  targetMl: number
}

export const waterTotal = (d: WaterDay | undefined) =>
  d ? d.entriesMl.reduce((a, b) => a + b, 0) : 0
