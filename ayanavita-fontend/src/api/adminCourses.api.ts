import { del, get, patch, post } from './http'

export type CourseTopicTranslations = Record<string, { name?: string; description?: string | null }>

export type CourseTopic = {
  id: number
  name: string
  description?: string | null
  translations?: CourseTopicTranslations
  _count?: { courses: number }
}

export type CourseAdmin = {
  id: number
  topicId?: number | null
  title: string
  slug: string
  published: boolean
  price: number
  topic?: { id: number; name: string } | null
}

export type TopicPayload = {
  name?: string
  description?: string
  translations?: {
    vi?: { name?: string; description?: string }
    'en-US'?: { name?: string; description?: string }
    de?: { name?: string; description?: string }
  }
}

export const adminCoursesApi = {
  listTopics: () => get<CourseTopic[]>('/admin/course-topics', { auth: true }),
  createTopic: (body: TopicPayload) => post<CourseTopic>('/admin/course-topics', body, { auth: true }),
  updateTopic: (id: number, body: TopicPayload) => patch<CourseTopic>(`/admin/course-topics/${id}`, body, { auth: true }),
  deleteTopic: (id: number) => del<{ id: number }>(`/admin/course-topics/${id}`, { auth: true }),
  listCourses: () => get<CourseAdmin[]>('/courses', { auth: true }),
}
