import { useEffect, useMemo, useState } from 'react'
import './styles/learning.css'
import { completeModule, getCourseLessons, getCourseProgress, getLessonDetail, getMyCourses, loginDemo, updateVideoProgress } from './api/learning.api'

type Lang = 'vi' | 'en' | 'de'
const t = {
  vi: { title: 'Khóa học của tôi', progress: 'Tiến độ', login: 'Đăng nhập user mẫu 12', lessons: 'Danh sách bài học', completeModule: 'Hoàn thành module', watched: 'Đã xem hết video', choose: 'Chọn khóa học', user: 'Học viên' },
  en: { title: 'My Courses', progress: 'Progress', login: 'Login demo user 12', lessons: 'Lessons', completeModule: 'Complete module', watched: 'Watched full video', choose: 'Choose course', user: 'Learner' },
  de: { title: 'Meine Kurse', progress: 'Fortschritt', login: 'Demo-Nutzer 12 anmelden', lessons: 'Lektionen', completeModule: 'Modul abschließen', watched: 'Video vollständig angesehen', choose: 'Kurs wählen', user: 'Teilnehmer' },
}

export default function App() {
  const [lang, setLang] = useState<Lang>('vi')
  const [token, setToken] = useState('')
  const [me, setMe] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [courseId, setCourseId] = useState<number | null>(null)
  const [lessonList, setLessonList] = useState<any[]>([])
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null)
  const [lesson, setLesson] = useState<any>(null)
  const [courseProgress, setCourseProgress] = useState(0)

  const tx = t[lang]

  const reloadCourse = async (id: number, tk = token) => {
    const [lessons, progress] = await Promise.all([getCourseLessons(id, tk), getCourseProgress(id, tk)])
    setLessonList(lessons)
    setCourseProgress(progress.percent || 0)
    const target = activeLessonId || lessons?.[0]?.id
    if (target) {
      const detail = await getLessonDetail(target, tk, lang)
      setLesson(detail)
      setActiveLessonId(target)
    }
  }

  useEffect(() => {
    if (!token || !activeLessonId) return
    getLessonDetail(activeLessonId, token, lang).then(setLesson)
  }, [lang])

  const login = async () => {
    const auth = await loginDemo()
    setToken(auth.accessToken)
    setMe(auth.user)
    const myCourses = await getMyCourses(auth.accessToken)
    setCourses(myCourses)
    const first = myCourses?.[0]?.course?.id
    if (first) {
      setCourseId(first)
      await reloadCourse(first, auth.accessToken)
    }
  }

  const markVideoDone = async (video: any) => {
    if (!lesson || !token) return
    await updateVideoProgress(lesson.id, video.id, video.durationSec || 0, true, token)
    if (courseId) await reloadCourse(courseId)
  }

  const markModuleDone = async (moduleId: number) => {
    if (!lesson || !token) return
    await completeModule(lesson.id, moduleId, token)
    if (courseId) await reloadCourse(courseId)
  }

  const checkedLessonIds = useMemo(() => {
    const done = new Set<number>()
    lessonList.forEach((l) => {
      if ((l.progress?.percent || 0) >= 100 || l.progress?.status === 'COMPLETED') done.add(l.id)
    })
    if (lesson && lesson.modules?.every((m: any) => m.progress?.completed)) done.add(lesson.id)
    return done
  }, [lessonList, lesson])

  return (
    <div className='learning'>
      <div className='top'>
        <h1>{tx.title}</h1>
        <div>
          <button onClick={login}>{tx.login}</button>
          <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}><option value='vi'>VI</option><option value='en'>EN</option><option value='de'>DE</option></select>
        </div>
      </div>
      {me && <p>{tx.user}: <b>{me.name || me.email}</b></p>}
      {courses.length > 0 && (
        <select value={courseId || ''} onChange={async (e) => { const id = Number(e.target.value); setCourseId(id); await reloadCourse(id) }}>
          <option value=''>{tx.choose}</option>
          {courses.map((c) => <option key={c.course.id} value={c.course.id}>{c.course.title}</option>)}
        </select>
      )}
      <div className='bar'><div style={{ width: `${courseProgress}%` }} /></div>
      <p>{tx.progress}: {courseProgress}%</p>

      <div className='layout'>
        <div className='left'>
          <h2>{lesson?.localizedTitle}</h2>
          {lesson?.modules?.map((m: any) => (
            <div key={m.id} className='module'>
              <div className='module-head'><strong>{m.localizedTitle}</strong><button onClick={() => markModuleDone(m.id)}>{tx.completeModule}</button></div>
              {m.videos?.map((v: any) => (
                <div key={v.id} className='video-row'>
                  <span>{v.localizedTitle}</span>
                  <button onClick={() => markVideoDone(v)}>{tx.watched} {v.progress?.completed ? '✓' : ''}</button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className='right'>
          <h3>{tx.lessons}</h3>
          {lessonList.map((l) => (
            <button key={l.id} className='lesson-item' onClick={async () => { setActiveLessonId(l.id); const d = await getLessonDetail(l.id, token, lang); setLesson(d) }}>
              <span>▾</span>
              <span>{checkedLessonIds.has(l.id) ? '✅' : '⬜'} {l.localizedTitle || l.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
