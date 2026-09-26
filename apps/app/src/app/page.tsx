import { BODYPARTS, CATALOGUE } from '@syntropy/core/exercises'
import { BrandMark } from '@syntropy/ui/brand/BrandMark'
import styles from './page.module.css'

// Phase 0 check screen: proves the static export, fonts, tokens and the engine package work
// end to end on the device. Replaced by the Welcome flow in Phase 4.
export default function Home() {
  return (
    <main className={styles.screen}>
      <div aria-hidden="true" className={`sy-orb sy-orb--ember ${styles.orbEmber}`} />
      <div aria-hidden="true" className={`sy-orb sy-orb--sage ${styles.orbSage}`} />

      <div className={styles.lockup}>
        <BrandMark size={34} />
        <span className={styles.word}>syntropy</span>
      </div>

      <section className={`sy-glass ${styles.card}`} aria-labelledby="engine-kicker">
        <span id="engine-kicker" className="sy-kicker">
          Engine check
        </span>
        <span className={`sy-metric ${styles.metric}`}>
          {CATALOGUE.length.toLocaleString('en-IN')}
        </span>
        <p className={styles.note}>
          exercises across {BODYPARTS.length} body parts, loaded from @syntropy/core.
        </p>
      </section>
    </main>
  )
}
