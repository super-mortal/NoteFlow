import request from '@/utils/request'

export interface TranscriberConfig {
  transcriber_type: string
  whisper_model_size: string
  available_types: { value: string; label: string }[]
  whisper_model_sizes: string[]
  /** 内置模型映射：size → HF repo_id */
  whisper_builtin_models?: Record<string, string>
  /** 用户自定义模型映射：名称 → HF repo_id 或本地路径 */
  whisper_custom_models?: Record<string, string>
  mlx_whisper_available: boolean
  /** OpenAI 兼容转写器使用的供应商 ID */
  openai_transcriber_provider: string
  /** OpenAI 兼容转写器使用的模型名 */
  openai_transcriber_model: string
  /** OpenAI 兼容转写器的 Base URL */
  openai_transcriber_base_url: string
  /** OpenAI 兼容转写器的 API Key */
  openai_transcriber_api_key: string
  /** Groq API Key */
  groq_api_key: string
  /** Groq 模型名称 */
  groq_model: string
  /** Groq 固定 Base URL */
  groq_base_url: string
  /** Groq 预设模型列表 */
  groq_preset_models: string[]
}

export interface ModelStatus {
  model_size: string
  downloaded: boolean
  downloading: boolean
}

export interface ModelsStatusResponse {
  whisper: ModelStatus[]
  mlx_whisper: ModelStatus[]
  mlx_available: boolean
}

export const getTranscriberConfig = async (): Promise<TranscriberConfig> => {
  return await request.get('/transcriber_config')
}

export const updateTranscriberConfig = async (data: {
  transcriber_type: string
  whisper_model_size?: string
  openai_transcriber_provider?: string
  openai_transcriber_model?: string
  openai_transcriber_base_url?: string
  openai_transcriber_api_key?: string
  groq_api_key?: string
  groq_model?: string
}) => {
  return await request.post('/transcriber_config', data)
}

export const getModelsStatus = async (): Promise<ModelsStatusResponse> => {
  return await request.get('/transcriber_models_status')
}

export const downloadModel = async (data: {
  model_size: string
  transcriber_type?: string
}) => {
  return await request.post('/transcriber_download', data)
}

export interface WhisperModelsResponse {
  builtin: Record<string, string>
  custom: Record<string, string>
}

/** 列出内置 + 自定义 whisper 模型映射 */
export const listWhisperModels = async (): Promise<WhisperModelsResponse> => {
  return await request.get('/whisper_models')
}

/** 新增自定义模型映射（名称 → HF repo_id 或本地路径） */
export const addWhisperModel = async (data: { name: string; target: string }) => {
  return await request.post('/whisper_models', data)
}

/** 删除自定义模型映射（不会删除已下载的模型文件） */
export const deleteWhisperModel = async (name: string) => {
  return await request.delete(`/whisper_models/${encodeURIComponent(name)}`)
}

/** 测试转写器连通性 */
export const testTranscriberConnection = async (data: {
  base_url: string
  api_key: string
  model?: string
}) => {
  return await request.post('/transcriber_test', data)
}
