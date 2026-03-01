import { useRef, useState } from 'react'
import type { CourseTopic } from '../../../api/adminCourses.api'
import { autoTranslateFromVietnamese, type LocaleMode } from '../tabs/i18nForm'

type AdminLang = 'vi' | 'en' | 'de'
type TopicI18nForm = Record<AdminLang, { name: string; description: string }>

type Props = {
  topics: CourseTopic[]
  coursesByTopic: Record<number, number>
  topicForm: TopicI18nForm
  editingId: number | null
  displayLang: AdminLang
  text: Record<string, string>
  setTopicField: (lang: AdminLang, field: 'name' | 'description', value: string) => void
  onSave: () => void
  onReset: () => void
  onEdit: (topic: CourseTopic) => void
  onDelete: (topic: CourseTopic) => void
}

const LANGS: LocaleMode[] = ['vi', 'en', 'de']

export function TopicsTab({
  topics,
  coursesByTopic,
  topicForm,
  editingId,
  displayLang,
  text,
  setTopicField,
  onSave,
  onReset,
  onEdit,
  onDelete,
}: Props) {
  const [mode, setMode] = useState<LocaleMode>('vi')
  const translateNameReqRef = useRef(0)
  const translateDescReqRef = useRef(0)

  const onChangeName = (value: string) => {
    setTopicField(mode, 'name', value)

    if (mode !== 'vi') return

    translateNameReqRef.current += 1
    const reqId = translateNameReqRef.current
    void Promise.all([autoTranslateFromVietnamese(value, 'en'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
      if (reqId !== translateNameReqRef.current) return
      setTopicField('en', 'name', en)
      setTopicField('de', 'name', de)
    })
  }

  const onChangeDescription = (value: string) => {
    setTopicField(mode, 'description', value)

    if (mode !== 'vi') return

    translateDescReqRef.current += 1
    const reqId = translateDescReqRef.current
    void Promise.all([autoTranslateFromVietnamese(value, 'en'), autoTranslateFromVietnamese(value, 'de')]).then(([en, de]) => {
      if (reqId !== translateDescReqRef.current) return
      setTopicField('en', 'description', en)
      setTopicField('de', 'description', de)
    })
  }

  const handleReset = () => {
    translateNameReqRef.current += 1
    translateDescReqRef.current += 1
    onReset()
  }

  return (
    <section className='admin-grid admin-courses-grid'>
      <article className='admin-card admin-card-glow admin-topic-form-card'>
        <h3 className='admin-card-title'><i className='fa-solid fa-pen-ruler' /> {text.topicForm}</h3>

        <div className='admin-row' style={{ marginBottom: 12 }}>
          {LANGS.map((lang) => (
            <button
              key={lang}
              className={`admin-btn ${mode === lang ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
              onClick={() => setMode(lang)}
              type='button'
            >
              {lang === 'en' ? 'EN' : lang.toUpperCase()}
            </button>
          ))}
        </div>

        <p className='admin-helper'>{text.topicSub}</p>

        <div className='admin-form-grid'>
          <label className='admin-field'>
            <span className='admin-label'>{text.topicName} ({mode})</span>
            <input
              value={topicForm[mode].name}
              onChange={(event) => onChangeName(event.target.value)}
              placeholder={text.topicNamePlaceholder}
              className='admin-input'
            />
          </label>

          <label className='admin-field'>
            <span className='admin-label'>{text.topicDescription} ({mode})</span>
            <input
              value={topicForm[mode].description}
              onChange={(event) => onChangeDescription(event.target.value)}
              placeholder={text.topicDescriptionPlaceholder}
              className='admin-input'
            />
          </label>

          <div className='admin-row'>
            <button onClick={onSave} className='admin-btn admin-btn-save'>
              <i className='fa-solid fa-floppy-disk' /> {editingId ? text.updateTopic : text.createTopic}
            </button>
            <button onClick={handleReset} className='admin-btn admin-btn-ghost'>
              <i className='fa-solid fa-rotate-left' /> {editingId ? text.cancelEdit : 'Làm mới'}
            </button>
          </div>
        </div>

        <div className='admin-topic-form-watermark' aria-hidden='true'>
          <span>A</span>
        </div>
      </article>

      <article className='admin-card admin-card-glow'>
        <h3 className='admin-card-title'><i className='fa-solid fa-table-list' /> {text.topicList} ({topics.length})</h3>
        <div className='admin-table-wrap'>
          <table className='admin-table'>
            <thead>
              <tr>
                <th>ID</th>
                <th>{text.topicName}</th>
                <th>{text.topicDescription}</th>
                <th>{text.courseCount}</th>
                <th>{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => {
                const total = coursesByTopic[topic.id] || topic._count?.courses || 0
                const localized = topic.translations?.[displayLang]
                return (
                  <tr key={topic.id}>
                    <td>{topic.id}</td>
                    <td className='td-strong'>{localized?.name || topic.name}</td>
                    <td>{localized?.description || topic.description || '-'}</td>
                    <td>{total}</td>
                    <td>
                      <div className='admin-row'>
                        <button className='admin-btn-icon admin-btn-icon-edit' onClick={() => onEdit(topic)} title={text.editTopic}>
                          <i className='fa-solid fa-pen' />
                        </button>
                        <button className='admin-btn-icon admin-btn-icon-delete' onClick={() => onDelete(topic)} title={text.deleteTopic}>
                          <i className='fa-solid fa-trash' />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
