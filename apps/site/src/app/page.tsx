import { BrandMark } from '@syntropy/ui/brand/BrandMark'
import styles from './page.module.css'

// Placeholder until the landing page is built from design/screens/Landing.dc.html (phase 13).
export default function Landing() {
  return (
    <main className={styles.hero}>
      <div className={styles.lockup}>
        <BrandMark size={48} />
        <span className={styles.word}>syntropy</span>
      </div>
      <h1 className={styles.title}>
        Order, built
        <br />
        <span className={styles.dim}>from chaos.</span>
      </h1>
      <p className="sy-kicker">Landing page in progress</p>
    </main>
  )
}
