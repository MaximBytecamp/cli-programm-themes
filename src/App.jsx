import { useEffect, useMemo, useState } from 'react'
import { lessons, cheatSheet, controlWorks, ENV_LIST, TOPICS } from './data/lessons.js'

const STORAGE_KEY = 'cli-practicum-state-v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { env: 'cmd', done: {} }
    const parsed = JSON.parse(raw)
    return {
      env: parsed.env || 'cmd',
      done: parsed.done || {},
    }
  } catch {
    return { env: 'cmd', done: {} }
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-600 active:bg-slate-500"
      title="Скопировать команду"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? 'Скопировано' : 'Копировать'}</span>
    </button>
  )
}

function TerminalCommand({ command, explanation, dangerous }) {
  return (
    <div className="space-y-1.5">
      <div
        className={`terminal-block flex items-center gap-3 overflow-x-auto rounded-lg px-4 py-3 font-mono text-sm ${
          dangerous ? 'border border-red-700/60 bg-red-950' : 'border border-slate-700 bg-slate-900'
        }`}
      >
        <span className={`select-none ${dangerous ? 'text-red-300' : 'text-emerald-400'}`}>$</span>
        <code className="min-w-0 flex-1 whitespace-pre text-slate-100">{command}</code>
        <CopyButton text={command} />
      </div>
      {explanation && (
        <p className="pl-1 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Что делает:</span> {explanation}
        </p>
      )}
    </div>
  )
}

function InfoBlock({ label, title, tone = 'slate', children }) {
  const tones = {
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  }

  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="mb-2 flex items-center gap-2 font-semibold">
        {label && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-white/70 px-1.5 text-[11px] font-bold uppercase tracking-wide">
            {label}
          </span>
        )}
        <span>{title}</span>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function LessonCard({ lesson, env, index, total, done, onToggleDone }) {
  const envData = lesson[env]

  return (
    <article id={`lesson-${lesson.id}`} className="scroll-mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Урок {index + 1} из {total}
            </div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{lesson.title}</h2>
          </div>
          {lesson.dangerous && (
            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
              Опасная команда
            </span>
          )}
        </div>
      </header>

      <div className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoBlock label="why" title="Зачем это нужно" tone="blue">
            {lesson.why}
          </InfoBlock>
          <InfoBlock label="goal" title="Цель действия" tone="indigo">
            {lesson.goal}
          </InfoBlock>
        </div>

        {envData.launchNotes && (
          <InfoBlock label="env" title="Особенности запуска в этой среде" tone="slate">
            {envData.launchNotes}
          </InfoBlock>
        )}

        {lesson.dangerous && (
          <InfoBlock label="risk" title="Внимание: опасное действие" tone="red">
            Файлы, удалённые из терминала, <strong>не попадают в корзину</strong>. Они исчезают сразу и навсегда.
            Всегда проверяйте имя файла перед удалением.
          </InfoBlock>
        )}

        <div>
          <h3 className="mb-2 font-semibold text-slate-800">Пошаговая инструкция</h3>
          <ol className="space-y-2">
            {envData.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed text-slate-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-slate-800">Команды</h3>
          <div className="space-y-3">
            {envData.commands.map((c, i) => (
              <TerminalCommand key={i} command={c.cmd} explanation={c.explanation} dangerous={c.dangerous} />
            ))}
          </div>
        </div>

        <InfoBlock label="ok" title="Что должно получиться" tone="green">
          {envData.expected}
        </InfoBlock>

        {envData.errors && envData.errors.length > 0 && (
          <InfoBlock label="fix" title="Частые ошибки" tone="amber">
            <ul className="list-disc space-y-1 pl-5">
              {envData.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </InfoBlock>
        )}

        <InfoBlock label="test" title="Как проверить, что всё получилось" tone="slate">
          {envData.verify}
        </InfoBlock>

        {envData.hints && (
          <InfoBlock label="tip" title="Подсказка для этой среды" tone="indigo">
            {envData.hints}
          </InfoBlock>
        )}

        <InfoBlock label="quiz" title="Вопрос для самопроверки" tone="blue">
          {lesson.selfCheck}
        </InfoBlock>

        <label className="flex cursor-pointer select-none items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
          <input
            type="checkbox"
            checked={!!done}
            onChange={onToggleDone}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="font-medium text-slate-800">
            {done ? 'Готово, задание выполнено' : 'Я выполнил это задание'}
          </span>
        </label>
      </div>
    </article>
  )
}

function ProgressBar({ done, total }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
        <span>Прогресс</span>
        <span>
          Выполнено <span className="font-bold text-indigo-600">{done}</span> из {total}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full bg-indigo-600 transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function EnvSwitcher({ env, setEnv }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ENV_LIST.map((e) => {
        const active = e.id === env
        return (
          <button
            key={e.id}
            type="button"
            onClick={() => setEnv(e.id)}
            className={`rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-all ${
              active
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400 hover:text-indigo-700'
            }`}
          >
            <span className="block text-xs uppercase tracking-wide opacity-75">{e.short}</span>
            <span>{e.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Sidebar({ env, setEnv, done, doneCount, resetProgress }) {
  const lessonById = useMemo(() => new Map(lessons.map((lesson) => [lesson.id, lesson])), [])

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollToLesson = (lessonId) => {
    scrollToId(`lesson-${lessonId}`)
  }

  return (
    <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">CLI</div>
          <h1 className="text-xl font-bold leading-tight text-slate-950">Практикум по командной строке</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Учебные темы собраны так, чтобы закрепить навигацию, файлы, поиск, потоки, диагностику и системные команды.
          </p>
        </div>

        <ProgressBar done={doneCount} total={lessons.length} />

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-800">Среда</div>
          <EnvSwitcher env={env} setEnv={setEnv} />
        </div>

        <nav className="space-y-3" aria-label="Темы уроков">
          <button
            type="button"
            onClick={() => scrollToId('control-works')}
            className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-left text-sm font-bold text-amber-900 transition-colors hover:bg-amber-100"
          >
            Контрольные работы
            <span className="mt-1 block text-xs font-medium text-amber-800">
              {controlWorks.length} работ для проверки студентов
            </span>
          </button>

          <div className="text-sm font-semibold text-slate-800">Темы для изучения</div>
          {TOPICS.map((topic) => {
            const topicLessons = topic.lessonIds.map((id) => lessonById.get(id)).filter(Boolean)
            const completed = topicLessons.filter((lesson) => done[lesson.id]).length
            return (
              <section key={topic.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">{topic.title}</h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{topic.description}</p>
                  </div>
                  <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                    {completed}/{topicLessons.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {topicLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => scrollToLesson(lesson.id)}
                      className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-white hover:text-indigo-700"
                    >
                      <span className={`h-2 w-2 rounded-full ${done[lesson.id] ? 'bg-emerald-500' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
        </nav>

        <button
          type="button"
          onClick={resetProgress}
          className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
        >
          Сбросить прогресс
        </button>
      </div>
    </aside>
  )
}

function CheatSheet({ env }) {
  const envName = ENV_LIST.find((e) => e.id === env)?.label || ''
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Мини-шпаргалка команд</h2>
        <p className="mt-1 text-sm text-slate-600">
          Для среды: <span className="font-semibold text-emerald-700">{envName}</span>
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Действие</th>
              <th className="px-6 py-3 text-left font-semibold">Команда</th>
            </tr>
          </thead>
          <tbody>
            {cheatSheet.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-6 py-3 text-slate-700">{row.action}</td>
                <td className="px-6 py-3">
                  <code className="rounded bg-slate-900 px-2.5 py-1 font-mono text-slate-100">
                    {row[env]}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ControlWorks() {
  return (
    <section id="control-works" className="scroll-mt-6 overflow-hidden rounded-lg border border-amber-300 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Проверка студентов</p>
        <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">Контрольные работы</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Задания рассчитаны на закрепление тем практикума. В карточках оставлены формулировка, ожидаемый результат
          и критерии оценки без отдельных проверочных команд преподавателя.
        </p>
      </header>

      <div className="divide-y divide-slate-100">
        {controlWorks.map((work) => (
          <article key={work.id} className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-950">{work.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{work.scope}</p>
              </div>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {work.duration}
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-700">{work.assignment}</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-2 text-sm font-bold text-slate-900">Что сдаёт студент</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
                  {work.deliverables.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-2 text-sm font-bold text-slate-900">Критерии проверки</h4>
                <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
                  {work.criteria.map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            </div>

          </article>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const [{ env, done }, setState] = useState(loadState)

  useEffect(() => {
    saveState({ env, done })
  }, [env, done])

  const setEnv = (id) => setState((s) => ({ ...s, env: id }))
  const toggleDone = (lessonId) =>
    setState((s) => ({ ...s, done: { ...s.done, [lessonId]: !s.done[lessonId] } }))
  const resetProgress = () => {
    if (window.confirm('Сбросить весь прогресс? Это действие нельзя отменить.')) {
      setState((s) => ({ ...s, done: {} }))
    }
  }

  const doneCount = useMemo(
    () => lessons.filter((l) => done[l.id]).length,
    [done]
  )
  const currentEnvLabel = ENV_LIST.find((e) => e.id === env)?.label

  return (
    <div className="min-h-screen">
      <main className="mx-auto grid max-w-[1440px] gap-6 px-4 py-4 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Sidebar
          env={env}
          setEnv={setEnv}
          done={done}
          doneCount={doneCount}
          resetProgress={resetProgress}
        />

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Текущая среда</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">{currentEnvLabel}</h2>
              </div>
              <div className="max-w-2xl text-sm leading-relaxed text-slate-600">
                Выберите тему слева и выполните команды по порядку. Многие уроки используют файлы из предыдущих
                шагов, поэтому удобнее проходить практикум сверху вниз.
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold text-indigo-950">CMD и PowerShell: коротко о разнице</h2>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-indigo-200 bg-white p-4">
                <div className="mb-1 font-semibold text-slate-900">CMD</div>
                <p className="text-slate-700">
                  Классическая командная строка Windows для простых команд и старых сценариев. Хорошо подходит для
                  базовой навигации и работы с файлами.
                </p>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-white p-4">
                <div className="mb-1 font-semibold text-slate-900">PowerShell</div>
                <p className="text-slate-700">
                  Современная оболочка Windows: команды возвращают объекты, есть удобная фильтрация, форматирование и
                  развитые инструменты администрирования.
                </p>
              </div>
            </div>
          </section>

          <ControlWorks />

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-950">Учебные темы и команды</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Ниже идут практические уроки. Контрольные работы теперь находятся выше и доступны из левого меню.
            </p>
          </section>

          <section className="space-y-6">
            {lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                env={env}
                index={index}
                total={lessons.length}
                done={!!done[lesson.id]}
                onToggleDone={() => toggleDone(lesson.id)}
              />
            ))}
          </section>

          <CheatSheet env={env} />

          <footer className="py-6 text-center text-sm text-slate-500">
            Учебный тренажёр для студентов. Прогресс сохраняется в вашем браузере.
          </footer>
        </div>
      </main>
    </div>
  )
}
