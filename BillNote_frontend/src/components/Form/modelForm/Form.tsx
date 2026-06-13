import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Skeleton } from '@/components/Skeleton'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useProviderStore } from '@/store/providerStore'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { testConnection, fetchModels, deleteModelById } from '@/services/model'
import { Save, TestTube, Loader2, RefreshCw, X, Plus, Brain, Key, Globe, CheckCircle2 } from 'lucide-react'
import { useModelStore } from '@/store/modelStore'
import { ModelPickerDialog } from '@/components/Form/modelForm/ModelPickerDialog'

const ProviderSchema = z.object({
  name: z.string().min(2, '名称不能少于 2 个字符'),
  apiKey: z.string().optional(),
  baseUrl: z.string().url('必须是合法 URL'),
  type: z.string(),
})

type ProviderFormValues = z.infer<typeof ProviderSchema>

interface ProviderConfigProps {
  providerId: string | null
  isCreate: boolean
  onSaved: () => void
  onCancel: () => void
}

const ProviderConfig = ({ providerId, isCreate, onSaved }: ProviderConfigProps) => {
  const loadProviderById = useProviderStore(state => state.loadProviderById)
  const updateProvider = useProviderStore(state => state.updateProvider)
  const addNewProvider = useProviderStore(state => state.addNewProvider)
  const loadModelsById = useModelStore(state => state.loadModelsById)

  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [isBuiltIn, setIsBuiltIn] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerModels, setPickerModels] = useState<any[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [newModelName, setNewModelName] = useState('')

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(ProviderSchema),
    defaultValues: {
      name: '',
      apiKey: '',
      baseUrl: '',
      type: 'custom',
    },
  })

  const reloadModels = async () => {
    if (!providerId) return
    const m = await loadModelsById(providerId)
    if (m) setModels(m)
  }

  useEffect(() => {
    const load = async () => {
      if (!isCreate && providerId) {
        const data = await loadProviderById(providerId!)
        if (data) {
          providerForm.reset({
            name: data.name || '',
            apiKey: data.apiKey || '',
            baseUrl: data.baseUrl || '',
            type: data.type || 'custom',
          })
          setIsBuiltIn(data.type === 'built-in')
        }
        await reloadModels()
      } else {
        providerForm.reset({ name: '', apiKey: '', baseUrl: '', type: 'custom' })
        setIsBuiltIn(false)
        setModels([])
      }
      setLoading(false)
    }
    load()
  }, [providerId, isCreate])

  const handleTest = async () => {
    const values = providerForm.getValues()
    if (!values.apiKey || !values.baseUrl) {
      toast.error('请填写 API Key 和 Base URL')
      return
    }
    if (!providerId && isCreate) {
      toast.error('请先保存供应商信息')
      return
    }
    setTesting(true)
    try {
      await testConnection({ id: providerId! })
      toast.success('连接测试成功 🎉')
    } catch {
      toast.error('连接测试失败')
    } finally {
      setTesting(false)
    }
  }

  const handleOpenPicker = async () => {
    if (!providerId) {
      toast.error('请先保存供应商')
      return
    }
    setPickerLoading(true)
    setPickerOpen(true)
    try {
      const res = await fetchModels(providerId)
      const list = res?.models?.data || res?.models || []
      setPickerModels(list)
    } catch {
      toast.error('加载模型列表失败')
      setPickerModels([])
    } finally {
      setPickerLoading(false)
    }
  }

  const handleAddModel = async (modelId: string) => {
    if (!providerId) return
    try {
      await useModelStore.getState().addNewModel(providerId, modelId)
      await reloadModels()
    } catch {
      toast.error('添加失败')
    }
  }

  const handleBatchAdd = async (ids: string[]) => {
    if (!providerId) return
    try {
      for (const id of ids) {
        await useModelStore.getState().addNewModel(providerId, id)
      }
      toast.success(`已添加 ${ids.length} 个模型`)
      await reloadModels()
    } catch {
      toast.error('批量添加失败')
    }
  }

  const handleManualAdd = async () => {
    const name = newModelName.trim()
    if (!name) { toast.error('请输入模型名称'); return }
    if (!providerId) { toast.error('请先保存供应商'); return }
    try {
      await useModelStore.getState().addNewModel(providerId, name)
      toast.success(`已添加 ${name}`)
      setNewModelName('')
      await reloadModels()
    } catch {
      toast.error('添加失败')
    }
  }

  const handleDeleteModel = async (modelId: number) => {
    if (!window.confirm('确定要删除这个模型吗？')) return
    try {
      await deleteModelById(modelId)
      toast.success('删除成功')
      await reloadModels()
    } catch {
      toast.error('删除失败')
    }
  }

  const onProviderSubmit = async (values: ProviderFormValues) => {
    try {
      if (!isCreate && providerId) {
        await updateProvider({ ...values, id: providerId })
      } else {
        await addNewProvider({ ...values })
      }
      toast.success('保存成功')
      onSaved()
    } catch {
      toast.error('保存失败')
    }
  }

  if (loading) {
    return (
      <div className="h-full p-6">
        <div className="space-y-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    )
  }

  const currentName = providerForm.watch('name')

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="mx-auto max-w-xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {isCreate ? '添加新供应商' : currentName}
              </h2>
              <p className="text-xs text-text-tertiary">
                {isCreate ? '添加一个新的 AI 模型供应商' : '管理 API 凭证与可用模型'}
              </p>
            </div>
          </div>

          {/* API 凭证 */}
          <Form {...providerForm}>
            <form onSubmit={providerForm.handleSubmit(onProviderSubmit)}>
              <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-l-2 border-primary pl-3">
                  <Key className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">API 凭证</h3>
                </div>

                <FormField
                  control={providerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-xs text-text-secondary">
                        <Brain className="h-3 w-3" />
                        名称
                      </FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isBuiltIn} placeholder="例如: OpenAI" className="h-9" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={providerForm.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-xs text-text-secondary">
                        <Globe className="h-3 w-3" />
                        API 地址
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://api.openai.com/v1" className="h-9 font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={providerForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1 text-xs text-text-secondary">
                        <Key className="h-3 w-3" />
                        API Key
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="sk-xxxxxxxxxxxxxxxx" className="h-9 font-mono text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={providerForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-text-secondary">类型</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="h-9 text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pt-1">
                  <Button type="submit" disabled={!providerForm.formState.isDirty && !isCreate} className="gap-1.5">
                    <Save className="h-4 w-4" />
                    {isCreate ? '创建供应商' : '保存修改'}
                  </Button>
                  <Button type="button" onClick={handleTest} variant="outline" disabled={testing} className="gap-1.5">
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                    测试连通性
                  </Button>
                </div>
              </div>
            </form>
          </Form>

          {/* 模型管理 */}
          {!isCreate && providerId && (
            <div className="rounded-xl border border-border/40 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-l-2 border-primary pl-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium">已启用模型</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {models && models.length > 0 ? (
                  models.map((model: any) => (
                    <span
                      key={model.id}
                      className="inline-flex items-center gap-1 rounded-md bg-primary-light px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {model.model_name}
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(model.id)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-text-tertiary">暂无模型</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="输入模型名称"
                  value={newModelName}
                  onChange={e => setNewModelName(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleManualAdd} className="h-8 gap-1 text-xs shrink-0">
                  <Plus className="h-3 w-3" />
                  添加
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleOpenPicker}
                  className="h-8 gap-1 text-xs shrink-0"
                >
                  <RefreshCw className="h-3 w-3" />
                  拉取列表
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模型选择弹框 */}
      <ModelPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        models={pickerModels}
        existingModelNames={models.map((m: any) => m.model_name)}
        loading={pickerLoading}
        onAddModel={handleAddModel}
        onBatchAdd={handleBatchAdd}
      />
    </ScrollArea>
  )
}

export default ProviderConfig
