import request from '@/utils/request'

export interface AdvancedNoteConfig {
  format: string[]
  extras: string
  video_understanding: boolean
  video_interval: number
  grid_size: number[]
  available_formats: { label: string; value: string }[]
}

export const getAdvancedNoteConfig = async (): Promise<AdvancedNoteConfig> => {
  return await request.get('/advanced_note_config')
}

export const updateAdvancedNoteConfig = async (data: {
  format?: string[]
  extras?: string
  video_understanding?: boolean
  video_interval?: number
  grid_size?: number[]
}) => {
  return await request.post('/advanced_note_config', data)
}
