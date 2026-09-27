'use client'

import { FIGURE_CSS, FRONT_SVG, SIDE_SVG } from './formFigure.data'

/** The board's animated 2.5D pull-up figure. `speed` 0.5 slows the loop to 6.4 s. */
export function FormFigure({
  view,
  width,
  speed = 1,
  paused = false,
}: {
  view: 'side' | 'front'
  width: number
  speed?: 0.5 | 1
  paused?: boolean
}) {
  const cls = ['mq-wrap', speed === 0.5 ? 'mq-slow' : '', paused ? 'mq-paused' : '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls}>
      <style>{FIGURE_CSS}</style>
      <svg
        aria-hidden="true"
        width={width}
        height={(width * 380) / 300}
        viewBox="0 0 300 380"
        style={{ display: 'block', overflow: 'visible' }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static artwork extracted from the design board
        dangerouslySetInnerHTML={{ __html: view === 'side' ? SIDE_SVG : FRONT_SVG }}
      />
    </div>
  )
}

/** Tempo cues and playhead share the figure's timing classes. */
export const TEMPO_CSS = FIGURE_CSS

/** Exercises the pull-up figure is a faithful demo for. */
export const isPullFamily = (name: string) => /pull[- ]?up|chin[- ]?up/i.test(name)
