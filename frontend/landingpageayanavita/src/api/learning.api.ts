import { apiFetch } from './client'

export type AuthRes = { accessToken: string; user: { id: number; name?: string; email: string } }

export const loginDemo = () =>
  apiFetch<AuthRes>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'isuuser12@ayanavita.local', password: '123456' }),
  })

export const getMyCourses = (token: string) => apiFetch<any[]>('/me/courses', { token })
export const getCourseProgress = (courseId: number, token: string) => apiFetch<any>(`/me/courses/${courseId}/progress`, { token })
export const getCourseLessons = (courseId: number, token: string) => apiFetch<any[]>(`/courses/${courseId}/lessons-outline`, { token })
export const getLessonDetail = (lessonId: number, token: string, lang: string) => apiFetch<any>(`/lessons/${lessonId}?lang=${lang}`, { token })
export const updateVideoProgress = (lessonId: number, videoId: number, watchedSec: number, completed: boolean, token: string) =>
  apiFetch<any>(`/lessons/${lessonId}/videos/${videoId}/progress`, {
    method: 'POST',
    token,
    body: JSON.stringify({ watchedSec, completed }),
  })
export const completeModule = (lessonId: number, moduleId: number, token: string) =>
  apiFetch<any>(`/lessons/${lessonId}/modules/${moduleId}/complete`, { method: 'POST', token })
