import { useEffect, useState } from 'react'
import {
  fetchMyProjects,
  type ProjectInfo,
} from '../auth/researcherAuth'
import { researcherCopy } from '../i18n/researcher'
import type { Lang } from '../i18n/preferences'
import './ResearcherFlow.css'

type ResearcherProjectsScreenProps = {
  lang: Lang
  onSelectProject: (slug: string) => void
  onBack: () => void
  onLogout: () => void
}

function projectLabel(project: ProjectInfo, lang: Lang): string {
  if (lang === 'en') return project.name_en
  if (lang === 'pt') return project.name_pt
  return project.name_es
}

export function ResearcherProjectsScreen({
  lang,
  onSelectProject,
  onBack,
  onLogout,
}: ResearcherProjectsScreenProps) {
  const t = researcherCopy[lang]
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void fetchMyProjects().then((list) => {
      if (!alive) return
      setProjects(list)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="r-flow" aria-labelledby="r-projects-brand">
      <div className="r-flow__atmosphere" aria-hidden="true" />

      <header className="r-flow__header">
        <h1 id="r-projects-brand" className="r-flow__brand">
          {t.brand}
        </h1>
        <p className="r-flow__subtitle">{t.subtitle}</p>
      </header>

      <section className="r-flow__panel">
        <h2 className="r-flow__section-title">{t.protocolsTitle}</h2>

        {loading && <p className="r-flow__muted">…</p>}

        {!loading && (
          <div className="r-flow__actions">
            {projects.map((project) => (
              <button
                key={project.id}
                type="button"
                className={`r-flow__protocol r-flow__protocol--${project.slug}`}
                onClick={() => onSelectProject(project.slug)}
              >
                {projectLabel(project, lang)}
              </button>
            ))}
          </div>
        )}

        <div className="r-flow__links">
          <button type="button" className="r-flow__link" onClick={onBack}>
            {t.back}
          </button>
          <button type="button" className="r-flow__link" onClick={onLogout}>
            {t.logout}
          </button>
        </div>
      </section>
    </main>
  )
}
