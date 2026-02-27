import { useEffect, useMemo, useState } from 'react'
import { adminCoursesApi, type CourseAdmin, type CourseTopic } from '../../api/adminCourses.api'
import { AlertJs } from '../../utils/alertJs'
import { CoursesTab } from './courseTabs/CoursesTab'
import { TopicsTab } from './courseTabs/TopicsTab'
import './AdminSpaPage.css'
import './AdminCoursesPage.css'

type TabKey = 'topics' | 'courses'
type ThemeMode = 'light' | 'dark'
type AdminLang = 'vi' | 'en-US' | 'de'
type TopicI18nForm = Record<AdminLang, { name: string; description: string }>

const THEME_STORAGE_KEY = 'admin-courses-theme-mode'
const LANG_STORAGE_KEY = 'admin-courses-lang'

const emptyTopicForm = (): TopicI18nForm => ({
  vi: { name: '', description: '' },
  'en-US': { name: '', description: '' },
  de: { name: '', description: '' },
})

const uiText: Record<AdminLang, Record<string, string>> = {
  vi: {
    kicker: 'TRUNG TÂM QUẢN TRỊ KHÓA HỌC',
    title: 'Quản trị chủ đề & danh mục khóa học',
    subtitle: 'Giao diện đồng bộ với quản trị dịch vụ, hỗ trợ nhập liệu đa ngôn ngữ và hiển thị theo ngôn ngữ quản trị.',
    darkMode: 'Dark mode',
    topicCount: 'Chủ đề khóa học',
    topicCountDesc: 'Danh mục chủ đề hiện có',
    courseCount: 'Tổng khóa học',
    courseCountDesc: 'Khoá học đang quản lý',
    publishedCount: 'Đã xuất bản',
    publishedCountDesc: 'Khoá học trạng thái Published',
    draftCount: 'Bản nháp',
    draftCountDesc: 'Khoá học trạng thái Draft',
    topicsTab: 'Chủ đề khóa học',
    coursesTab: 'Khoá học hiện có',
    loading: 'Đang tải dữ liệu...',
    topicForm: 'Form chủ đề khóa học',
    topicName: 'Tên chủ đề',
    topicSub: 'Vui lòng nhập nội dung bằng tiếng Việt làm mặc định. Hệ thống sẽ tự động gợi ý bản dịch tiếng Anh và Đức. Vui lòng kiểm tra kỹ bản dịch trước khi lưu.',
    topicNamePlaceholder: 'Nhập tên chủ đề',
    topicDescription: 'Mô tả ngắn',
    topicDescriptionPlaceholder: 'Mô tả tuỳ chọn',
    updateTopic: 'Cập nhật chủ đề',
    createTopic: 'Tạo chủ đề',
    cancelEdit: 'Huỷ chỉnh sửa',
    topicList: 'Danh sách chủ đề',
    courseCountCol: 'Số khoá học',
    actions: 'Thao tác',
    editTopic: 'Sửa chủ đề',
    deleteTopic: 'Xoá chủ đề',
    validateName: 'Vui lòng nhập tên chủ đề cho ngôn ngữ hiện tại',
    updateSuccess: 'Đã cập nhật chủ đề',
    createSuccess: 'Đã tạo chủ đề mới',
    deleteSuccess: 'Đã xóa chủ đề thành công',
    loadFailed: 'Không thể tải dữ liệu quản trị khóa học',
    saveFailed: 'Lưu chủ đề thất bại',
    deleteFailed: 'Không thể xóa chủ đề',
    displayMode: 'Chế độ hiển thị',
  },
  'en-US': {
    kicker: 'COURSE ADMIN CENTER',
    title: 'Manage course topics & categories',
    subtitle: 'Service-admin style interface with multilingual input and language-based display for operators.',
    darkMode: 'Dark mode',
    topicCount: 'Course topics',
    topicCountDesc: 'Existing topic groups',
    courseCount: 'Total courses',
    courseCountDesc: 'Courses under management',
    publishedCount: 'Published',
    publishedCountDesc: 'Courses in Published status',
    draftCount: 'Draft',
    draftCountDesc: 'Courses in Draft status',
    topicsTab: 'Course topics',
    coursesTab: 'Current courses',
    loading: 'Loading data...',
    topicForm: 'Course topic form',
    topicName: 'Topic name',
    topicSub: 'Please enter content in Vietnamese by default. The system will automatically suggest English and German translations. Please review the translations carefully before saving.',
    topicNamePlaceholder: 'Enter topic name',
    topicDescription: 'Short description',
    topicDescriptionPlaceholder: 'Optional description',
    updateTopic: 'Update topic',
    createTopic: 'Create topic',
    cancelEdit: 'Cancel edit',
    topicList: 'Topic list',
    courseCountCol: 'Course count',
    actions: 'Actions',
    editTopic: 'Edit topic',
    deleteTopic: 'Delete topic',
    validateName: 'Please enter topic name for active language',
    updateSuccess: 'Topic updated',
    createSuccess: 'Topic created',
    deleteSuccess: 'Topic deleted successfully',
    loadFailed: 'Unable to load course admin data',
    saveFailed: 'Failed to save topic',
    deleteFailed: 'Unable to delete topic',
    displayMode: 'Display mode',
  },
  de: {
    kicker: 'KURS-ADMIN-ZENTRUM',
    title: 'Kursthemen & Kategorien verwalten',
    subtitle: 'Service-Management-Stil mit mehrsprachiger Eingabe und sprachabhängiger Anzeige für Admins.',
    darkMode: 'Dark mode',
    topicCount: 'Kursthemen',
    topicCountDesc: 'Vorhandene Themengruppen',
    courseCount: 'Gesamte Kurse',
    courseCountDesc: 'Verwaltete Kurse',
    publishedCount: 'Veröffentlicht',
    publishedCountDesc: 'Kurse im Status Published',
    draftCount: 'Entwurf',
    draftCountDesc: 'Kurse im Status Draft',
    topicsTab: 'Kursthemen',
    coursesTab: 'Aktuelle Kurse',
    loading: 'Daten werden geladen...',
    topicForm: 'Kursthema-Formular',
    topicName: 'Themenname',
    topicSub: 'Bitte geben Sie den Inhalt standardmäßig auf Vietnamesisch ein. Das System schlägt automatisch englische und deutsche Übersetzungen vor. Bitte überprüfen Sie die Übersetzungen sorgfältig, bevor Sie speichern.',
    topicNamePlaceholder: 'Themenname eingeben',
    topicDescription: 'Kurzbeschreibung',
    topicDescriptionPlaceholder: 'Optionale Beschreibung',
    updateTopic: 'Thema aktualisieren',
    createTopic: 'Thema erstellen',
    cancelEdit: 'Bearbeitung abbrechen',
    topicList: 'Themenliste',
    courseCountCol: 'Kursanzahl',
    actions: 'Aktionen',
    editTopic: 'Thema bearbeiten',
    deleteTopic: 'Thema löschen',
    validateName: 'Bitte Themenname für aktive Sprache eingeben',
    updateSuccess: 'Thema wurde aktualisiert',
    createSuccess: 'Thema wurde erstellt',
    deleteSuccess: 'Thema erfolgreich gelöscht',
    loadFailed: 'Kursverwaltungsdaten konnten nicht geladen werden',
    saveFailed: 'Thema konnte nicht gespeichert werden',
    deleteFailed: 'Thema konnte nicht gelöscht werden',
    displayMode: 'Anzeigemodus',
  },
}

const languageMeta: Record<AdminLang, { label: string; flagUrl: string; alt: string }> = {
  'en-US': { label: 'English (US)', flagUrl: 'https://flagcdn.com/w40/us.png', alt: 'USA flag' },
  de: { label: 'Deutsch', flagUrl: 'https://flagcdn.com/w40/de.png', alt: 'Germany flag' },
  vi: { label: 'Tiếng Việt', flagUrl: 'https://flagcdn.com/w40/vn.png', alt: 'Vietnam flag' },
}

const toTopicForm = (topic?: CourseTopic | null): TopicI18nForm => ({
  vi: {
    name: topic?.translations?.vi?.name || topic?.name || '',
    description: topic?.translations?.vi?.description || topic?.description || '',
  },
  'en-US': {
    name: topic?.translations?.['en-US']?.name || topic?.name || '',
    description: topic?.translations?.['en-US']?.description || topic?.description || '',
  },
  de: {
    name: topic?.translations?.de?.name || topic?.name || '',
    description: topic?.translations?.de?.description || topic?.description || '',
  },
})

export default function AdminCoursesPage() {
  const [tab, setTab] = useState<TabKey>('topics')
  const [topics, setTopics] = useState<CourseTopic[]>([])
  const [courses, setCourses] = useState<CourseAdmin[]>([])
  const [topicForm, setTopicForm] = useState<TopicI18nForm>(() => emptyTopicForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    return saved === 'dark' ? 'dark' : 'light'
  })
  const [lang, setLang] = useState<AdminLang>(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
    return saved === 'en-US' || saved === 'de' ? saved : 'vi'
  })

  const t = uiText[lang]

  const loadAll = async () => {
    setLoading(true)
    try {
      const [topicItems, courseItems] = await Promise.all([adminCoursesApi.listTopics(), adminCoursesApi.listCourses()])
      setTopics(topicItems)
      setCourses(courseItems)
    } catch (e: any) {
      AlertJs.error(e?.message || t.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  }, [lang])

  const resetForm = () => {
    setTopicForm(emptyTopicForm())
    setEditingId(null)
  }

  const coursesByTopic = useMemo(() => {
    const map: Record<number, number> = {}
    courses.forEach((course) => {
      if (course.topicId) map[course.topicId] = (map[course.topicId] || 0) + 1
    })
    return map
  }, [courses])

  const setTopicField = (activeLang: AdminLang, field: 'name' | 'description', value: string) => {
    setTopicForm((prev) => ({
      ...prev,
      [activeLang]: {
        ...prev[activeLang],
        [field]: value,
      },
    }))
  }

  const saveTopic = async () => {
    const fallbackName = topicForm.vi.name || topicForm['en-US'].name || topicForm.de.name
    if (!fallbackName.trim()) {
      AlertJs.error(t.validateName)
      return
    }

    const payload = {
      name: fallbackName.trim(),
      description: (topicForm.vi.description || topicForm['en-US'].description || topicForm.de.description || '').trim() || undefined,
      translations: {
        vi: { name: topicForm.vi.name.trim(), description: topicForm.vi.description.trim() },
        'en-US': { name: topicForm['en-US'].name.trim(), description: topicForm['en-US'].description.trim() },
        de: { name: topicForm.de.name.trim(), description: topicForm.de.description.trim() },
      },
    }

    try {
      if (editingId) {
        await adminCoursesApi.updateTopic(editingId, payload)
        AlertJs.success(t.updateSuccess)
      } else {
        await adminCoursesApi.createTopic(payload)
        AlertJs.success(t.createSuccess)
      }
      resetForm()
      await loadAll()
    } catch (e: any) {
      AlertJs.error(e?.message || t.saveFailed)
    }
  }

  const deleteTopic = async (topic: CourseTopic) => {
    try {
      await adminCoursesApi.deleteTopic(topic.id)
      AlertJs.success(t.deleteSuccess)
      await loadAll()
    } catch (e: any) {
      AlertJs.error(e?.message || t.deleteFailed)
    }
  }

  const startEditTopic = (topic: CourseTopic) => {
    setEditingId(topic.id)
    setTopicForm(toTopicForm(topic))
  }


  const createCourse = async (payload: any) => {
    try {
      await adminCoursesApi.createCourse(payload)
      AlertJs.success('Đã tạo khoá học')
      await loadAll()
    } catch (e: any) {
      AlertJs.error(e?.message || 'Tạo khoá học thất bại')
      throw e
    }
  }

  const updateCourse = async (id: number, payload: any) => {
    try {
      await adminCoursesApi.updateCourse(id, payload)
      AlertJs.success('Đã cập nhật khoá học')
      await loadAll()
    } catch (e: any) {
      AlertJs.error(e?.message || 'Cập nhật khoá học thất bại')
      throw e
    }
  }

  const deleteCourse = async (course: CourseAdmin) => {
    const ok = window.confirm(`Xoá khoá học "${course.title}"?`)
    if (!ok) return

    try {
      await adminCoursesApi.deleteCourse(course.id)
      AlertJs.success('Đã xoá khoá học')
      await loadAll()
    } catch (e: any) {
      AlertJs.error(e?.message || 'Xoá khoá học thất bại')
      throw e
    }
  }

  return (
    <main className={`admin-page admin-courses-theme ${theme === 'dark' ? 'admin-courses-theme-dark' : ''}`}>
      <section className='admin-header'>
        <div>
          <p className='admin-header-kicker'>{t.kicker}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>

        <div className='admin-courses-theme-switch' role='group' aria-label='Display settings'>
          <span className='admin-courses-theme-switch-label'>{t.darkMode}</span>
          <button
            type='button'
            className={`admin-courses-theme-toggle ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'dark'}
          >
            <span className='admin-courses-theme-toggle-thumb' />
          </button>

          <div className='admin-lang-switch' role='group' aria-label={t.displayMode}>
            {(['en-US', 'de', 'vi'] as AdminLang[]).map((code) => {
              const item = languageMeta[code]
              const active = lang === code
              return (
                <button
                  key={code}
                  type='button'
                  className={`admin-lang-option ${active ? 'active' : ''}`}
                  onClick={() => setLang(code)}
                  aria-pressed={active}
                  title={item.label}
                  aria-label={item.label}
                >
                  <img src={item.flagUrl} alt={item.alt} loading='lazy' />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className='admin-overview'>
        <article className='overview-card'>
          <span><i className='fa-solid fa-layer-group' /> {t.topicCount}</span>
          <strong>{topics.length}</strong>
          <small>{t.topicCountDesc}</small>
        </article>
        <article className='overview-card'>
          <span><i className='fa-solid fa-book-open-reader' /> {t.courseCount}</span>
          <strong>{courses.length}</strong>
          <small>{t.courseCountDesc}</small>
        </article>
        <article className='overview-card'>
          <span><i className='fa-solid fa-circle-check' /> {t.publishedCount}</span>
          <strong>{courses.filter((course) => course.published).length}</strong>
          <small>{t.publishedCountDesc}</small>
        </article>
        <article className='overview-card'>
          <span><i className='fa-solid fa-pen-to-square' /> {t.draftCount}</span>
          <strong>{courses.filter((course) => !course.published).length}</strong>
          <small>{t.draftCountDesc}</small>
        </article>
      </section>

      <section className='admin-tabs'>
        <button className={`admin-tab ${tab === 'topics' ? 'active' : ''}`} onClick={() => setTab('topics')}>
          <i className='fa-solid fa-tags' /> {t.topicsTab}
        </button>
        <button className={`admin-tab ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')}>
          <i className='fa-solid fa-graduation-cap' /> {t.coursesTab}
        </button>
      </section>

      {loading && <p className='admin-helper'>{t.loading}</p>}

      {!loading && tab === 'topics' && (
        <TopicsTab
          topics={topics}
          coursesByTopic={coursesByTopic}
          topicForm={topicForm}
          editingId={editingId}
          displayLang={lang}
          text={{ ...t, courseCount: t.courseCountCol }}
          setTopicField={setTopicField}
          onSave={saveTopic}
          onReset={resetForm}
          onEdit={startEditTopic}
          onDelete={(topic) => {
            void deleteTopic(topic)
          }}
        />
      )}

      {!loading && tab === 'courses' && (
        <CoursesTab
          courses={courses}
          topics={topics}
          text={t}
          onCreateCourse={createCourse}
          onUpdateCourse={updateCourse}
          onDeleteCourse={deleteCourse}
        />
      )}
    </main>
  )
}
