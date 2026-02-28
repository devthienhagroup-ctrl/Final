import { del, get, patch, post } from './http'

export type CourseTopicTranslations = Record<string, { name?: string; description?: string | null }>

export type CourseTopic = {
  id: number
  name: string
  description?: string | null
  translations?: CourseTopicTranslations
  _count?: { courses: number }
}

export type LocalizedText = { vi?: string; en?: string; de?: string }

export type LessonVideoPayload = {
  title: string
  description?: string
  translations?: Record<string, { title: string; shortDescription?: string; description?: string }>
  sourceUrl?: string
  durationSec?: number
  order?: number
  published?: boolean
}

export type LessonModulePayload = {
  title: string
  description?: string
  translations?: Record<string, { title: string; shortDescription?: string; description?: string }>
  order?: number
  published?: boolean
  videos?: LessonVideoPayload[]
}

export type LessonPayload = {
  title: string
  slug: string
  description?: string
  translations?: Record<string, { title: string; description?: string }>
  content?: string
  videoUrl?: string
  modules?: LessonModulePayload[]
  order?: number
  published?: boolean
}

export type LessonVideoAdmin = LessonVideoPayload & { id: number; hlsPlaylistKey?: string }
export type LessonModuleAdmin = LessonModulePayload & { id: number; videos: LessonVideoAdmin[] }

export type LessonAdmin = {
  id: number
  courseId: number
  title: string
  slug: string
  description?: string
  translations?: Record<string, { title: string; description?: string }>
  content?: string
  order?: number
  published: boolean
  createdAt?: string
  updatedAt?: string
}

export type LessonDetailAdmin = LessonAdmin & { modules: LessonModuleAdmin[] }

export type CourseAdmin = {
  id: number
  topicId?: number | null
  title: string
  shortDescription?: string | null
  slug: string
  description?: string | null
  thumbnail?: string | null
  published: boolean
  price: number
  topic?: { id: number; name: string } | null
  translations?: Record<string, { title: string; description?: string }>
  objectives?: string[]
  targetAudience?: string[]
  benefits?: string[]
  contentTranslations?: Record<string, { objectives?: string[]; targetAudience?: string[]; benefits?: string[] }>
  ratingAvg?: number
  ratingCount?: number
  enrollmentCount?: number
  createdAt?: string
  updatedAt?: string
  videoCount?: number
  _count?: { lessons?: number }
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

export type CoursePayload = {
  topicId?: number
  title: string
  shortDescription?: string
  slug: string
  description?: string
  thumbnail?: string
  price?: number
  published?: boolean
  translations?: Record<string, { title: string; description?: string }>
  objectives?: string[]
  targetAudience?: string[]
  benefits?: string[]
  contentTranslations?: Record<string, { objectives?: string[]; targetAudience?: string[]; benefits?: string[] }>
  ratingAvg?: number
  ratingCount?: number
  enrollmentCount?: number
}

export type CourseListResponse = {
  items: CourseAdmin[]
  total: number
  page: number
  pageSize: number
}

export type CourseDetailAdmin = CourseAdmin

export const adminCoursesApi = {
  listTopics: () => get<CourseTopic[]>('/admin/course-topics', { auth: true }),
  createTopic: (body: TopicPayload) => post<CourseTopic>('/admin/course-topics', body, { auth: true }),
  updateTopic: (id: number, body: TopicPayload) => patch<CourseTopic>(`/admin/course-topics/${id}`, body, { auth: true }),
  deleteTopic: (id: number) => del<{ id: number }>(`/admin/course-topics/${id}`, { auth: true }),
  listCourses: (params?: { topicId?: number; search?: string; page?: number; pageSize?: number; lang?: string }) => {
    const qs = new URLSearchParams()
    if (params?.topicId) qs.set('topicId', String(params.topicId))
    if (params?.search?.trim()) qs.set('search', params.search.trim())
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.lang) qs.set('lang', params.lang)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<CourseListResponse>(`/courses${suffix}`, { auth: true })
  },
  createCourse: (body: CoursePayload | FormData) => post<CourseAdmin>('/courses', body, { auth: true }),
  updateCourse: (id: number, body: Partial<CoursePayload> | FormData) => patch<CourseAdmin>(`/courses/${id}`, body, { auth: true }),
  deleteCourse: (id: number) => del<{ id: number }>(`/courses/${id}`, { auth: true }),
  getCourseDetail: (id: number, lang?: string) => {
    const qs = new URLSearchParams()
    if (lang) qs.set('lang', lang)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<CourseDetailAdmin>(`/courses/${id}${suffix}`, { auth: true })
  },

  listCourseLessons: (courseId: number) => get<LessonAdmin[]>(`/courses/${courseId}/lessons-outline`, { auth: true }),
  getLessonDetail: (lessonId: number) => get<LessonDetailAdmin>(`/lessons/${lessonId}`, { auth: true }),
  createLesson: (courseId: number, body: LessonPayload) => post<LessonAdmin>(`/courses/${courseId}/lessons`, body, { auth: true }),
  updateLesson: (lessonId: number, body: Partial<LessonPayload>) => patch<LessonAdmin>(`/lessons/${lessonId}`, body, { auth: true }),
  deleteLesson: (lessonId: number) => del<{ id: number }>(`/lessons/${lessonId}`, { auth: true }),

  uploadModuleMedia: (lessonId: number, moduleId: string | number, file: File, type: 'video' | 'image', order?: number) => {
    const body = new FormData()
    body.append('file', file)
    body.append('type', type)
    if (order !== undefined) body.append('order', String(order))
    return post<{ moduleId?: string; lessonId?: number; hlsPlaylistKey?: string; segmentCount?: number; imageKey?: string; sourceUrl?: string; storage: string; videoId?: number }>(`/lessons/${lessonId}/modules/${moduleId}/media/upload`, body, { auth: true })
  },
}
