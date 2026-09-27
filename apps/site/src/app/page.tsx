import { BodyMap, BrandMark, Gauge, Icon, type IconName, ParticleMark } from '@syntropy/ui'
import { Phone } from '@/components/Phone'
import { WidgetsPhone } from '@/components/WidgetsPhone'
import s from './page.module.css'

const REPO = 'https://github.com/Atul-Chahar/syntropy'
const APK = `${REPO}/releases/latest`
const DEMO = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/demo/`

const DISHES = [
  'Roti',
  'Dal tadka',
  'Rajma chawal',
  'Idli',
  'Masala dosa',
  'Poha',
  'Palak paneer',
  'Dahi',
  'Chole',
  'Biryani',
  'Upma',
  'Khichdi',
  'Paratha',
  'Sambar',
  'Aloo gobi',
  'Masala chai',
]

const FATIGUE = {
  'upper-back': 'fatigued',
  biceps: 'recovering',
  deltoids: 'recovering',
  quadriceps: 'fatigued',
  hamstring: 'recovering',
  chest: 'ready',
  abs: 'ready',
  calves: 'ready',
  triceps: 'ready',
  gluteal: 'recovering',
  trapezius: 'recovering',
  forearm: 'ready',
} as const

function Orb({
  tone,
  size,
  style,
}: {
  tone: 'sage' | 'ember' | 'water'
  size: number
  style: React.CSSProperties
}) {
  const rgb = { sage: '137,170,124', ember: '255,107,61', water: '156,199,224' }[tone]
  return (
    <div
      aria-hidden="true"
      className={s.drift}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(${rgb},0.4) 0%, rgba(${rgb},0.13) 38%, rgba(${rgb},0) 70%)`,
        ...style,
      }}
    />
  )
}

function Feature({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div className={`${s.feature} ${s.reveal}`}>
      <span className={`sy-glass ${s.featureIcon}`}>
        <Icon name={icon} size={22} />
      </span>
      <span>
        <span className={s.stepTitle}>{title}</span>
        <span className={s.stepBody}>{body}</span>
      </span>
    </div>
  )
}

export default function Landing() {
  return (
    <div className={s.page}>
      <Orb tone="ember" size={900} style={{ right: -380, top: -300 }} />
      <Orb tone="sage" size={900} style={{ left: -420, top: 500 }} />

      <nav aria-label="Main" className={`sy-glass-dark ${s.nav} ${s.rise}`}>
        <a href="#top" className={s.brand}>
          <BrandMark size={28} />
          syntropy
        </a>
        <div className={s.links}>
          <a href="#nutrition">Nutrition</a>
          <a href="#targets">Targets</a>
          <a href="#training">Training</a>
          <a href="#coach">Coach</a>
          <a href="#widgets">Widgets</a>
          <a href="#privacy">Privacy</a>
        </div>
        <span style={{ display: 'flex', gap: 8 }}>
          <a
            href={REPO}
            className={`sy-glass ${s.btn} ${s.btnGlass} ${s.btnSmall} ${s.navCta}`}
            aria-label="Source on GitHub"
          >
            <Icon name="star" size={16} />
            Star
          </a>
          <a href={DEMO} className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>
            Try the demo
            <Icon name="arrowUpRight" size={16} />
          </a>
        </span>
      </nav>

      <main>
        <section id="top" aria-label="Introduction" className={s.wrap}>
          <div className={s.hero}>
            <div>
              <div className={`${s.kicker} ${s.rise} ${s.d1}`}>
                /ˈsin.trə.pi/ · the inverse of entropy
              </div>
              <h1 className={`${s.h1} ${s.rise} ${s.d2}`}>
                Order, built
                <br />
                <span className={s.dim}>from chaos.</span>
              </h1>
              <p className={`${s.lede} ${s.rise} ${s.d3}`}>
                Syntropy reads your training, meals and recovery as one living system. Snap your
                thali, log your sets, and see exactly what your body needs today. Open source,
                private, on your phone.
              </p>
              <div className={`${s.ctas} ${s.rise} ${s.d4}`}>
                <a href={DEMO} className={`${s.btn} ${s.btnPrimary}`}>
                  Try the web demo
                  <Icon name="arrowUpRight" size={18} />
                </a>
                <a href={APK} className={`sy-glass ${s.btn} ${s.btnGlass}`}>
                  <Icon name="download" size={18} />
                  Android APK
                </a>
              </div>
              <div className={`${s.stats} ${s.rise} ${s.d5}`}>
                {[
                  ['<2s', 'Photo to macros'],
                  ['1,324', 'Guided exercises'],
                  ['170', 'Indian foods built in'],
                  ['0', 'Accounts or servers'],
                ].map(([n, l]) => (
                  <div key={l} className={s.stat}>
                    <span className={s.statNum}>{n}</span>
                    <span className={s.statLabel}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${s.phones} ${s.rise} ${s.d3}`}>
              <Phone
                src="food"
                alt="Food log with calorie ring, water and meals"
                className={s.phoneA}
                scale={0.78}
              />
              <Phone
                src="home"
                alt="Home with the homeostasis dial"
                className={s.phoneB}
                scale={0.78}
              />
              <div className={`sy-glass-dark ${s.floatLabel}`}>
                <span>Roti × 2</span>
                <span className="sy-mono" style={{ fontSize: 11, color: 'rgba(243,241,236,0.62)' }}>
                  210 kcal · 94% match
                </span>
              </div>
              <span
                className={`sy-glass ${s.orbBadge}`}
                style={{ left: -10, top: 10, color: '#FFC7B0' }}
              >
                <Icon name="flame" size={26} />
              </span>
              <span
                className={`sy-glass ${s.orbBadge}`}
                style={{ right: -10, bottom: 120, color: '#A9C3A0', animationDelay: '-3s' }}
              >
                <Icon name="leaf" size={26} />
              </span>
            </div>
          </div>
        </section>

        <section id="nutrition" aria-label="AI nutrition" className={s.section}>
          <Orb tone="ember" size={700} style={{ left: -300, top: 100 }} />
          <div className={`${s.wrap} ${s.split} ${s.splitReverse}`}>
            <div className={s.phoneCenter}>
              <Phone src="scan" alt="Scanning a thali with Gemini Vision" scale={0.82} />
            </div>
            <div>
              <div className={`${s.kicker} ${s.reveal}`}>
                AI nutrition · built for Indian plates
              </div>
              <h2 className={`${s.h2} ${s.reveal}`}>
                One photo.
                <br />
                <span className={s.dim}>Every roti counted.</span>
              </h2>
              <p className={`${s.p} ${s.reveal}`}>
                Most calorie apps were built for sandwiches and salads. Syntropy is tuned for how
                India eats, from a Monday thali to a Sunday biryani.
              </p>
              <div className={s.steps}>
                {[
                  [
                    '01',
                    'Snap the plate',
                    'Gemini Vision names every dish on your thali and estimates each katori, roti and bowl — in about two seconds.',
                  ],
                  [
                    '02',
                    'Confirm in pieces, not grams',
                    'Adjust the way you actually eat: 2 roti, half a katori of rice, one bowl of dahi. Values come from a 170-food Indian table.',
                  ],
                  [
                    '03',
                    'Add the second helping',
                    'Had two more roti after the photo? Add them to the same meal in two taps, or just type “2 more roti and a katori dahi”.',
                  ],
                ].map(([n, t, b]) => (
                  <div key={n} className={`sy-glass ${s.card} ${s.step} ${s.reveal}`}>
                    <span className={s.stepNum}>{n}</span>
                    <span>
                      <span className={s.stepTitle}>{t}</span>
                      <span className={s.stepBody}>{b}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div aria-hidden="true" className={s.marquee}>
            <div className={s.track}>
              {[...DISHES, ...DISHES].map((d, i) => (
                <span key={`${d}-${i}`} className={`sy-glass ${s.dish}`}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="targets" aria-label="Targets" className={s.section}>
          <div className={`${s.wrap} ${s.split}`}>
            <div>
              <div className={`${s.kicker} ${s.reveal}`}>Target physique</div>
              <h2 className={`${s.h2} ${s.reveal}`}>
                Targets shaped by the
                <br />
                body you are building.
              </h2>
              <p className={`${s.p} ${s.reveal}`}>
                Pick the physique you want and a pace you can keep. Syntropy turns it into calories,
                protein, carbs, fat and water from your own body (Mifflin-St Jeor), then adjusts
                every Sunday from your real weight trend and training load.
              </p>
              <div className={`${s.chips} ${s.reveal}`}>
                {['Lean & defined', 'Recomposition', 'Lean muscle', 'Maintain'].map((g, i) => (
                  <span key={g} className={`${s.chip} ${i === 0 ? s.chipOn : ''}`}>
                    {g}
                  </span>
                ))}
              </div>
              <div className={`${s.targetStats} ${s.reveal}`}>
                {[
                  ['2,100', 'kcal', 'Training day'],
                  ['150', 'g', 'Protein'],
                  ['3.5', 'L', 'Water'],
                ].map(([n, u, l]) => (
                  <div key={l} className={s.stat}>
                    <span>
                      <span className={s.statNum}>{n}</span>{' '}
                      <span className={s.statLabel}>{u}</span>
                    </span>
                    <span className={s.statLabel}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={s.phoneCenter}>
              <Phone src="goal" alt="Target physique and daily targets" scale={0.82} />
            </div>
          </div>
        </section>

        <section id="training" aria-label="Training" className={s.section}>
          <Orb tone="sage" size={800} style={{ right: -360, top: 0 }} />
          <div className={s.wrap}>
            <div className={s.center}>
              <div className={`${s.kicker} ${s.reveal}`}>Training · Recovery · Fuel</div>
              <h2 className={`${s.h2} ${s.reveal}`}>Two halves of one loop.</h2>
              <p className={`${s.p} ${s.reveal}`}>
                Heavy leg day yesterday? Your carb target rises today. Lats still fatigued? Your
                plan knows. Syntropy connects what you lift with what you eat.
              </p>
            </div>
            <div className={s.three}>
              <div className={`sy-glass ${s.card} ${s.loopCard} ${s.reveal}`}>
                <div>
                  <div className={s.loopTitle}>Fatigue map</div>
                  <div className={s.loopBody}>
                    See which muscles are still recovering before you pick a session. Built on
                    OpenGym&apos;s recovery model.
                  </div>
                </div>
                <div className={s.loopArt} style={{ gap: 18 }}>
                  <BodyMap side="front" states={FATIGUE} width={110} />
                  <BodyMap side="back" states={FATIGUE} width={110} />
                </div>
              </div>
              <div className={`sy-glass ${s.card} ${s.loopCard} ${s.reveal}`}>
                <div>
                  <div className={s.loopTitle}>Log every set</div>
                  <div className={s.loopBody}>
                    Rest timer, RPE, progression that tells you the weight before you walk to the
                    bar, and a form guide for the big lifts.
                  </div>
                </div>
                <div className={s.loopArt}>
                  <Phone src="workout" alt="Workout logger with rest timer" scale={0.62} />
                </div>
              </div>
              <div className={`sy-glass ${s.card} ${s.loopCard} ${s.reveal}`}>
                <div>
                  <div className={s.loopTitle}>Energy homeostasis</div>
                  <div className={s.loopBody}>
                    Meals, training and basal burn on one dial. No red warnings, just clear numbers.
                  </div>
                </div>
                <div
                  className={s.loopArt}
                  style={{ flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <Gauge net={-272} label="kcal net balance" />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: 24,
                      fontSize: 14,
                      color: 'rgba(243,241,236,0.7)',
                    }}
                  >
                    <span>
                      Energy in <strong style={{ color: '#F3F1EC', fontWeight: 400 }}>2,170</strong>
                    </span>
                    <span>
                      Energy out{' '}
                      <strong style={{ color: '#F3F1EC', fontWeight: 400 }}>2,442</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="coach" aria-label="Coach" className={s.section}>
          <div className={`${s.wrap} ${s.split} ${s.splitReverse}`}>
            <div className={s.phoneCenter} style={{ gap: 20 }}>
              <Phone src="coach" alt="Coach intro with the orb" scale={0.7} />
              <Phone src="chat" alt="Coach chat with one-tap actions" scale={0.7} />
            </div>
            <div>
              <div className={`${s.kicker} ${s.reveal}`}>AI Coach · Gemini</div>
              <h2 className={`${s.h2} ${s.reveal}`}>
                A coach
                <br />
                <span className={s.dim}>trained on you.</span>
              </h2>
              <p className={`${s.p} ${s.reveal}`}>
                Ask what to eat for dinner, why you feel tired, or to plan next week. Coach reads a
                summary of your own logs, never invents numbers, and offers one-tap actions you
                approve.
              </p>
              <div className={s.features}>
                <Feature
                  icon="sparkle"
                  title="Grounded in your data"
                  body="Today's meals, targets, water, readiness and recent sessions — summarised on the phone, nothing else."
                />
                <Feature
                  icon="file"
                  title="Photos and PDFs"
                  body="Share your trainer's diet plan or a photo of lunch and ask how today compares."
                />
                <Feature
                  icon="calendar"
                  title="Weekly check-in"
                  body="Code adjusts your targets by at most 150 kcal from your trend; Coach explains why. You accept or keep."
                />
              </div>
            </div>
          </div>
        </section>

        <section id="widgets" aria-label="Widgets" className={s.section}>
          <Orb tone="water" size={700} style={{ left: -260, top: 120 }} />
          <div className={`${s.wrap} ${s.split}`}>
            <div>
              <div className={`${s.kicker} ${s.reveal}`}>Widgets · Water · Rest timer</div>
              <h2 className={`${s.h2} ${s.reveal}`}>
                Your day,
                <br />
                one glance away.
              </h2>
              <p className={`${s.p} ${s.reveal}`}>
                The things you check fifty times a day live on your home screen, not three taps
                deep.
              </p>
              <div className={s.features}>
                <Feature
                  icon="target"
                  title="Calories left, at a glance"
                  body="The Today widget shows kcal left, protein and water."
                />
                <Feature
                  icon="drop"
                  title="Water in one tap"
                  body="Add a 250 ml glass straight from the home screen."
                />
                <Feature
                  icon="stopwatch"
                  title="Rest timer that follows you"
                  body="A notification tells you when rest is over, even with the screen off."
                />
                <Feature
                  icon="plus"
                  title="Quick add roti, dahi, chai"
                  body="Your most eaten foods, one tap from the widget."
                />
              </div>
            </div>
            <div className={s.phoneCenter} style={{ gap: 20 }}>
              <WidgetsPhone scale={0.82} />
            </div>
          </div>
        </section>

        <section id="privacy" aria-label="Privacy" className={s.section}>
          <div className={s.wrap}>
            <div className={s.center}>
              <div className={`${s.kicker} ${s.reveal}`}>Private by design</div>
              <h2 className={`${s.h2} ${s.reveal}`}>Your body data is yours.</h2>
            </div>
            <div className={s.privacy}>
              {[
                [
                  'lock',
                  'Local-first',
                  'Workouts, meals and photos stay on your phone. No account, no server. Export a backup whenever you like.',
                ],
                [
                  'fingerprint',
                  'Fingerprint lock',
                  'Unlock with your fingerprint, face or screen lock. Nothing to remember, nothing to leak.',
                ],
                [
                  'check',
                  'You stay in control',
                  'Your own free Gemini key lives in Android secure storage. Every AI estimate waits for your confirmation.',
                ],
              ].map(([ic, t, b]) => (
                <div key={t} className={`sy-glass ${s.card} ${s.privacyCard} ${s.reveal}`}>
                  <span className={`sy-glass ${s.featureIcon}`}>
                    <Icon name={ic as IconName} size={22} />
                  </span>
                  <span className={s.stepTitle}>{t}</span>
                  <span className={s.stepBody}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="join" aria-label="Get Syntropy" className={`${s.wrap} ${s.join}`}>
          <div className={s.reveal} style={{ display: 'flex', justifyContent: 'center' }}>
            <ParticleMark size={140} />
          </div>
          <h2 className={`${s.h2} ${s.reveal}`} style={{ fontSize: 'clamp(44px, 6.5vw, 84px)' }}>
            Start building order.
          </h2>
          <p className={`${s.p} ${s.reveal}`} style={{ margin: '22px auto 0' }}>
            Free and open source under the AGPL. Try it in your browser, install the Android app, or
            build it yourself.
          </p>
          <div className={`${s.ctas} ${s.reveal}`} style={{ justifyContent: 'center' }}>
            <a href={DEMO} className={`${s.btn} ${s.btnPrimary}`}>
              Try the web demo
              <Icon name="arrowUpRight" size={18} />
            </a>
            <a href={APK} className={`sy-glass ${s.btn} ${s.btnGlass}`}>
              <Icon name="download" size={18} />
              Download APK
            </a>
            <a href={REPO} className={`sy-glass ${s.btn} ${s.btnGlass}`}>
              <Icon name="star" size={18} />
              Star on GitHub
            </a>
          </div>
          <footer className={s.footer}>
            <span className={s.brand}>
              <BrandMark size={24} />
              syntropy
            </span>
            <span className="sy-mono" style={{ fontSize: 12, letterSpacing: '0.08em' }}>
              TRAIN · FUEL · RECOVER · 2026
            </span>
            <span style={{ display: 'flex', gap: 22 }}>
              <a href={REPO}>GitHub</a>
              <a href={`${REPO}/blob/main/NOTICE.md`}>Credits</a>
              <a href={`${REPO}/blob/main/LICENSE`}>AGPL-3.0</a>
            </span>
          </footer>
        </section>
      </main>
    </div>
  )
}
