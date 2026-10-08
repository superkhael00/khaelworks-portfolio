import { useCallback, useId, useState } from 'react'
import { CalendarCheck, Calculator } from '@/components/slab'
import BookingModal from './BookingModal'

/**
 * SavingsCalculator - "How much is this task costing you?" on Services.
 *
 * Pure arithmetic in the browser, nothing is sent anywhere. Picking a task
 * fills in typical numbers the visitor then adjusts. The result states the
 * cost of doing the task by hand, not a promised saving: automation takes the
 * repetitive part, a person still approves the decisions.
 */

type Task = { label: string; perWeek: number; minutes: number }

const TASKS: Task[] = [
  { label: 'Invoice & expense entry', perWeek: 40, minutes: 6 },
  { label: 'Lead follow-up', perWeek: 30, minutes: 8 },
  { label: 'Candidate screening', perWeek: 50, minutes: 5 },
  { label: 'Bookkeeping review', perWeek: 60, minutes: 3 },
  { label: 'Reports & data entry', perWeek: 10, minutes: 30 },
  { label: 'Something else', perWeek: 20, minutes: 10 },
]

const WEEKS_PER_MONTH = 52 / 12

const fmtHours = (h: number) => (h >= 10 ? Math.round(h).toLocaleString('en-US') : h.toFixed(1))
const fmtMoney = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  onChange: (n: number) => void
}) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="scalc__field">
      <div className="scalc__field-row">
        <label htmlFor={id} className="scalc__label">{label}</label>
        <output htmlFor={id} className="scalc__value">
          {value.toLocaleString('en-US')} <span>{unit}</span>
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="scalc__range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export default function SavingsCalculator() {
  const [task, setTask] = useState(0)
  const [perWeek, setPerWeek] = useState(TASKS[0].perWeek)
  const [minutes, setMinutes] = useState(TASKS[0].minutes)
  const [rate, setRate] = useState(15)
  const [booking, setBooking] = useState(false)
  const closeBooking = useCallback(() => setBooking(false), [])
  const taskId = useId()

  const pickTask = (i: number) => {
    setTask(i)
    setPerWeek(TASKS[i].perWeek)
    setMinutes(TASKS[i].minutes)
  }

  const hoursMonth = (perWeek * minutes * WEEKS_PER_MONTH) / 60
  const costMonth = hoursMonth * rate
  const costYear = costMonth * 12

  return (
    <div className="scalc" aria-labelledby="scalc-title">
      <header className="sgrid__flow-head">
        <div className="sgrid__flow-copy">
          <span className="sgrid__flow-eyebrow">Quick check</span>
          <h2 className="sgrid__flow-title" id="scalc-title">How much is this task costing you?</h2>
          <p className="sgrid__flow-sub">
            Pick a task and adjust the numbers to match your week. Nothing you enter leaves this page.
          </p>
        </div>
      </header>

      <div className="scalc__card">
        <div className="scalc__inputs">
          <div className="scalc__field">
            <label htmlFor={taskId} className="scalc__label">The task</label>
            <select id={taskId} className="scalc__select" value={task} onChange={(e) => pickTask(Number(e.target.value))}>
              {TASKS.map((t, i) => (
                <option key={t.label} value={i}>{t.label}</option>
              ))}
            </select>
          </div>
          <Slider label="How often" value={perWeek} min={1} max={200} unit="times a week" onChange={setPerWeek} />
          <Slider label="Time each time" value={minutes} min={1} max={60} unit="min" onChange={setMinutes} />
          <Slider label="Hourly cost of the person doing it" value={rate} min={5} max={100} unit="USD / hr" onChange={setRate} />
        </div>

        <div className="scalc__result" aria-live="polite">
          <span className="scalc__result-icon" aria-hidden="true">
            <Calculator size={20} weight="duotone" />
          </span>
          <p className="scalc__result-label">Done by hand, this task takes about</p>
          <p className="scalc__big">
            {fmtHours(hoursMonth)} <span>hours a month</span>
          </p>
          <dl className="scalc__money">
            <div>
              <dt>Per month</dt>
              <dd>{fmtMoney(costMonth)}</dd>
            </div>
            <div>
              <dt>Per year</dt>
              <dd>{fmtMoney(costYear)}</dd>
            </div>
          </dl>
          <p className="scalc__note">
            Automation takes over the repetitive part. A person still approves the decisions, so plan to keep a little of this time.
          </p>
          <button type="button" className="scalc__cta" onClick={() => setBooking(true)}>
            <CalendarCheck size={18} weight="fill" aria-hidden="true" />
            Get these hours back: book a free 20-min call
          </button>
        </div>
      </div>
      {booking && <BookingModal onClose={closeBooking} />}
    </div>
  )
}
