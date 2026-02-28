import { useEffect, useMemo, useState } from 'react'
import { adminCoursesApi, type LessonAdmin } from '../../../../api/adminCourses.api'
import type { CourseDetailAdmin } from '../../../../api/adminCourses.api'
import { CreateLessonModal } from './CreateLessonModal'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  onUpdated: () => Promise<void> | void
}

export function CourseLessonListTab({ course, lang, onUpdated }: Props) {
  const [items, setItems] = useState<LessonAdmin[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const t = useMemo(() => {
    if (lang === 'en') return { title: 'Lesson list', add: 'Add lesson', empty: 'No lessons yet' }
    if (lang === 'de') return { title: 'Lektionsliste', add: 'Lektion hinzufügen', empty: 'Noch keine Lektionen' }
    return { title: 'Danh sách bài học', add: 'Thêm bài học mới', empty: 'Chưa có bài học' }
  }, [lang])

  const load = async () => {
    setLoading(true)
    try {
      const rows = await adminCoursesApi.listCourseLessons(course.id, lang)
      setItems(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [course.id, lang])

  return (
    <div className='admin-card'>
      <div className='admin-row' style={{ justifyContent: 'space-between' }}>
        <h4>{t.title}</h4>
        <button type='button' className='admin-btn' onClick={() => setOpen(true)}>{t.add}</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {items.length ? items.map((item) => <li key={item.id}>{item.stt}. {item.title}</li>) : <li>{t.empty}</li>}
        </ul>
      )}
      <CreateLessonModal
        open={open}
        lang={lang}
        courseId={course.id}
        onClose={() => setOpen(false)}
        onCreated={async () => {
          await load()
          await onUpdated()
        }}
      />
    </div>
  )
}
