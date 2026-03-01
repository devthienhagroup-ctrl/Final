import { del, get, patch, post } from './http'
import type { CourseAdmin, CourseDetailAdmin, CourseListResponse, CourseManagementApi, CoursePayload, CourseTopic, LessonAdmin, LessonDetailAdmin, LessonOutlineAdmin, LessonPayload } from './adminCourses.api'

export const instructorCoursesApi: CourseManagementApi = {
  listTopics: () => get<CourseTopic[]>('/instructor/course-topics', { auth: true }),
  listCourses: (params) => {
    const qs = new URLSearchParams()
    if (params?.topicId) qs.set('topicId', String(params.topicId))
    if (params?.search?.trim()) qs.set('search', params.search.trim())
    if (params?.page) qs.set('page', String(params.page))
    if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params?.lang) qs.set('lang', params.lang)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<CourseListResponse>(`/instructor/courses${suffix}`, { auth: true })
  },
  createCourse: (body: CoursePayload | FormData) => post<CourseAdmin>('/instructor/courses', body, { auth: true }),
  updateCourse: (id: number, body: Partial<CoursePayload> | FormData) => patch<CourseAdmin>(`/instructor/courses/${id}`, body, { auth: true }),
  deleteCourse: (id: number) => del<{ id: number }>(`/instructor/courses/${id}`, { auth: true }),
  getCourseDetail: (id: number, lang?: string) => {
    const qs = new URLSearchParams()
    if (lang) qs.set('lang', lang)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<CourseDetailAdmin>(`/instructor/courses/${id}${suffix}`, { auth: true })
  },
  listCourseLessons: (courseId: number, lang?: string) => {
    const qs = new URLSearchParams()
    if (lang) qs.set('lang', lang)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<LessonOutlineAdmin[]>(`/instructor/courses/${courseId}/lessons-outline${suffix}`, { auth: true })
  },
  getLessonDetail: (lessonId: number, lang?: string) => {
    const qs = new URLSearchParams()
    if (lang) qs.set('lang', lang)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return get<LessonDetailAdmin>(`/instructor/lessons/${lessonId}${suffix}`, { auth: true })
  },
  createLesson: (courseId: number, body: LessonPayload) => post<LessonAdmin>(`/instructor/courses/${courseId}/lessons`, body, { auth: true }),
  updateLesson: (lessonId: number, body: Partial<LessonPayload>) => patch<LessonAdmin>(`/instructor/lessons/${lessonId}`, body, { auth: true }),
  deleteLesson: (lessonId: number) => del<{ id: number }>(`/instructor/lessons/${lessonId}`, { auth: true }),
  uploadModuleMedia: (lessonId, moduleId, file, type, order) => {
    const body = new FormData()
    body.append('file', file)
    body.append('type', type)
    if (order !== undefined) body.append('order', String(order))
    return post<{ moduleId?: string; lessonId?: number; hlsPlaylistKey?: string; segmentCount?: number; imageKey?: string; sourceUrl?: string; storage: string; videoId?: number }>(`/instructor/lessons/${lessonId}/modules/${moduleId}/media/upload`, body, { auth: true })
  },
}
