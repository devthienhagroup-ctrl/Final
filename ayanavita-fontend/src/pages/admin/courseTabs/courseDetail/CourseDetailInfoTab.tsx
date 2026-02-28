import { type CourseDetailAdmin, type CourseTopic } from '../../../../api/adminCourses.api'

type Props = {
  course: CourseDetailAdmin
  lang: 'vi' | 'en' | 'de'
  text: Record<string, string>
  topics: CourseTopic[]
}

export function CourseDetailInfoTab({ course, lang, text, topics }: Props) {
  const displayTopicName = (topic: CourseTopic) => {
    if (lang === 'de') return topic.translations?.de?.name || topic.name
    if (lang === 'en') return topic.translations?.en?.name || topic.name
    return topic.translations?.vi?.name || topic.name
  }

  const topic = topics.find((item) => item.id === course.topicId)

  return (
    <div className='admin-row' style={{ flexDirection: 'column', gap: 10 }}>
      <div><b>ID:</b> {course.id}</div>
      <div><b>{text.titleCol}:</b> {course.title}</div>
      <div><b>{text.topicCol}:</b> {topic ? displayTopicName(topic) : text.unassigned}</div>
      <div><b>{text.priceCol}:</b> {(course.price || 0).toLocaleString('vi-VN')}đ</div>
      <div><b>{text.ratingCol}:</b> {course.ratingAvg ?? 0} ({course.ratingCount ?? 0})</div>
      <div><b>{text.enrollmentCol}:</b> {course.enrollmentCount ?? 0}</div>
      <div><b>{text.lessonCol}:</b> {course._count?.lessons ?? 0}</div>
      <div><b>{text.videoCountCol}:</b> {course.videoCount ?? 0}</div>
      <div><b>{text.statusCol}:</b> {course.published ? text.publishedStatus : text.draftStatus}</div>
      <div><b>{text.createdAtCol}:</b> {course.createdAt ? new Date(course.createdAt).toLocaleString('vi-VN') : '--'}</div>
      <div><b>{text.updatedAtCol}:</b> {course.updatedAt ? new Date(course.updatedAt).toLocaleString('vi-VN') : '--'}</div>
    </div>
  )
}
