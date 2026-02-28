import { type CourseDetailAdmin, type CourseTopic } from '../../../../api/adminCourses.api'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
}

type InfoItem = {
  key: string
  label: string
  value: string | number
  icon: string
  fullWidth?: boolean
}

type CourseTranslationItem = {
  locale: string
  title?: string
  shortDescription?: string
  description?: string
}

type CourseContentTranslationItem = {
  locale: string
  objectives?: string[]
  targetAudience?: string[]
  benefits?: string[]
}

export function CourseDetailInfoTab({ course, lang, text, topics }: Props) {
  const displayTopicName = (topic: CourseTopic) => {
    if (lang === 'de') return topic.translations?.de?.name || topic.name
    if (lang === 'en') return topic.translations?.en?.name || topic.name
    return topic.translations?.vi?.name || topic.name
  }

  const normalizeTranslations = (value: CourseDetailAdmin['translations']): CourseTranslationItem[] => {
    if (!value) return []
    if (Array.isArray(value)) return value as CourseTranslationItem[]
    return Object.entries(value).map(([locale, item]) => ({ locale, ...item }))
  }

  const normalizeContentTranslations = (value: CourseDetailAdmin['contentTranslations']): CourseContentTranslationItem[] => {
    if (!value) return []
    if (Array.isArray(value)) return value as CourseContentTranslationItem[]
    return Object.entries(value).map(([locale, item]) => ({ locale, ...item }))
  }

  const topic = topics.find((item) => item.id === course.topicId)
  const translations = normalizeTranslations(course.translations)
  const contentTranslations = normalizeContentTranslations(course.contentTranslations)

  const infoItems: InfoItem[] = [
    { key: 'id', label: 'ID', value: course.id || '--', icon: 'fa-hashtag' },
    { key: 'topicId', label: 'Topic ID', value: course.topicId ?? '--', icon: 'fa-fingerprint' },
    { key: 'topic', label: text.topicCol, value: topic ? displayTopicName(topic) : text.unassigned, icon: 'fa-folder-tree' },
    { key: 'slug', label: 'Slug', value: course.slug || '--', icon: 'fa-link' },
    { key: 'description', label: 'Description', value: course.description || '--', icon: 'fa-paragraph', fullWidth: true },
    { key: 'price', label: text.priceCol, value: `${(course.price || 0).toLocaleString('vi-VN')}đ`, icon: 'fa-money-bill-wave' },
    { key: 'rating', label: text.ratingCol, value: `${course.ratingAvg ?? 0} (${course.ratingCount ?? 0})`, icon: 'fa-star' },
    { key: 'enrollment', label: text.enrollmentCol, value: course.enrollmentCount ?? 0, icon: 'fa-user-graduate' },
    { key: 'lesson', label: text.lessonCol, value: course._count?.lessons ?? 0, icon: 'fa-book-open' },
    { key: 'video', label: text.videoCountCol, value: course.videoCount ?? 0, icon: 'fa-video' },
    {
      key: 'createdAt',
      label: text.createdAtCol,
      value: course.createdAt ? new Date(course.createdAt).toLocaleString('vi-VN') : '--',
      icon: 'fa-clock',
    },
    {
      key: 'updatedAt',
      label: text.updatedAtCol,
      value: course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : '--',
      icon: 'fa-rotate',
    },
  ]

  return (
    <div className='admin-row' style={{ gap: 14, flexWrap: 'wrap', alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 100%', borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 12 }}>
        <div className='admin-row' style={{ gap: 12, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              style={{ width: 250, height: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.35)', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 250,
                height: 150,
                borderRadius: 8,
                border: '1px dashed rgba(148, 163, 184, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              No image
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <i className='fa-solid fa-heading' style={{ width: 16, color: '#22d3ee' }} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{text.titleCol}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 26, lineHeight: 1.25, marginBottom: 8, color: '#22c55e' }}>{course.title || '--'}</div>
            <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <i className='fa-solid fa-align-left' style={{ width: 16, color: '#22d3ee' }} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Short description</span>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.4, wordBreak: 'break-word' }}>{course.shortDescription || '--'}</div>
          </div>
        </div>
      </div>

      {infoItems.map((item) => (
        <div
          key={item.key}
          style={{
            flex: item.fullWidth ? '1 1 100%' : '1 1 320px',
            minWidth: item.fullWidth ? '100%' : 280,
            borderBottom: '1px dashed rgba(148, 163, 184, 0.35)',
            paddingBottom: 10,
          }}
        >
          <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <i className={`fa-solid ${item.icon}`} style={{ width: 16, color: '#22d3ee' }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{item.label}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.4, wordBreak: 'break-word' }}>{item.value}</div>
        </div>
      ))}

      <div style={{ flex: '1 1 320px', minWidth: 280, borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 10 }}>
        <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <i className='fa-solid fa-circle-check' style={{ width: 16, color: '#22d3ee' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{text.statusCol}</span>
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.4 }}>
          {course.published ? text.publishedStatus : text.draftStatus}
        </div>
      </div>

      <div style={{ flex: '1 1 100%', borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 10 }}>
        <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <i className='fa-solid fa-language' style={{ width: 16, color: '#22d3ee' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Translations</span>
        </div>
        {translations.length ? (
          <div className='admin-row' style={{ gap: 12, flexWrap: 'wrap' }}>
            {translations.map((translation) => (
              <div key={translation.locale} style={{ flex: '1 1 300px', minWidth: 280 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{translation.locale.toUpperCase()}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Title:</b> {translation.title || '--'}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Short:</b> {translation.shortDescription || '--'}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Description:</b> {translation.description || '--'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontWeight: 600 }}>--</div>
        )}
      </div>

      <div style={{ flex: '1 1 100%', borderBottom: '1px dashed rgba(148, 163, 184, 0.35)', paddingBottom: 10 }}>
        <div className='admin-row' style={{ gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <i className='fa-solid fa-list-check' style={{ width: 16, color: '#22d3ee' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Content translations</span>
        </div>
        {contentTranslations.length ? (
          <div className='admin-row' style={{ gap: 12, flexWrap: 'wrap' }}>
            {contentTranslations.map((translation) => (
              <div key={translation.locale} style={{ flex: '1 1 300px', minWidth: 280 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{translation.locale.toUpperCase()}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Objectives:</b> {translation.objectives?.join(' • ') || '--'}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Target:</b> {translation.targetAudience?.join(' • ') || '--'}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Benefits:</b> {translation.benefits?.join(' • ') || '--'}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontWeight: 600 }}>--</div>
        )}
      </div>
    </div>
  )
}
