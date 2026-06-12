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
import { useParams, useNavigate } from 'react-router-dom'
import { useProviderStore } from '@/store/providerStore'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { testConnection, fetchModels, deleteModelById } from '@/services/model.ts'
import { ModelSelector } from '@/components/Form/modelForm/ModelSelector.tsx'
import { Alert, AlertDescription } from '@/components/ui/alert.tsx'
import { ArrowLeft, Save, TestTube, X, Loader2, RefreshCw } from 'lucide-react'
import { useModelStore } from '@/store/modelStore'

// ✅ Provider表单schema
const ProviderSchema = z.object({
  name: z.string().min(2, '名称不能少于 2 个字符'),
  apiKey: z.string().optional(),
  baseUrl: z.string().url('必须是合法 URL'),
  type: z.string(),
})

type ProviderFormValues = z.infer<typeof ProviderSchema>

// ✅ Model表单schema
const ModelSchema = z.object({
  modelName: z.string().min(1, '请选择或填写模型名称'),
})

type ModelFormValues = z.infer<typeof ModelSchema>
interface IModel {
  id: string
  created: number
  object: string
  owned_by: string
  permission: string
  root: string
}

const ProviderForm = ({ isCreate = false }: { isCreate?: boolean }) => {
  let { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !isCreate

  const getProviderById = useProviderStore(state => state.getProviderById)
  const loadProviderById = useProviderStore(state => state.loadProviderById)
  const updateProvider = useProviderStore(state => state.updateProvider)
  const addNewProvider = useProviderStore(state => state.addNewProvider)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [isBuiltIn, setIsBuiltIn] = useState(false)
  const loadModelsById = useModelStore(state => state.loadModelsById)
  const [modelOptions, setModelOptions] = useState<IModel[]>([])
  const [models, setModels] = useState([])
  const [modelLoading, setModelLoading] = useState(false)
  const [search, setSearch] = useState('')

  const providerForm = useForm<ProviderFormValues>({
    resolver: zodResolver(ProviderSchema),
    defaultValues: {
      name: '',
      apiKey: '',
      baseUrl: '',
      type: 'custom',
    },
  })

  const filteredModelOptions = modelOptions.filter(model => {
    const keywords = search.trim().toLowerCase().split(/\s+/)
    const target = model.id.toLowerCase()
    return keywords.every(kw => target.includes(kw))
  })

  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(ModelSchema),
    defaultValues: {
      modelName: '',
    },
  })

  useEffect(() => {
    const load = async () => {
      if (isEditMode) {
        const data = await loadProviderById(id!)
        providerForm.reset(data)
        setIsBuiltIn(data.type === 'built-in')
      } else {
        providerForm.reset({
          name: '',
          apiKey: '',
          baseUrl: '',
          type: 'custom',
        })
        setIsBuiltIn(false)
      }
      const models = await loadModelsById(id!)
      if (models) {
        setModels(models)
      }
      setLoading(false)
    }
    load()
  }, [id])

  const handelDelete = async (modelId) => {
    if (!window.confirm('确定要删除这个模型吗？')) return
    try {
      await deleteModelById(modelId)
      toast.success('删除成功')
    } catch (e) {
      toast.error('删除异常')
    }
  }

  // 测试连通性
  const handleTest = async () => {
    const values = providerForm.getValues()
    if (!values.apiKey || !values.baseUrl) {
      toast.error('请填写 API Key 和 Base URL')
      return
    }
    try {
      if (!id) {
        toast.error('请先保存供应商信息')
        return
      }
      setTesting(true)
      await testConnection({ id })
      toast.success('测试连通性成功 🎉')
    } catch (error) {
      toast.error('测试连通性失败')
    } finally {
      setTesting(false)
    }
  }

  // 加载模型列表
  const handleModelLoad = async () => {
    const values = providerForm.getValues()
    if (!values.apiKey || !values.baseUrl) {
      toast.error('请先填写 API Key 和 Base URL')
      return
    }
    try {
      setModelLoading(true)
      const res = await fetchModels(id!, { noCache: true })
      if (res.data.code === 0 && res.data.data.models.data.length > 0) {
        setModelOptions(res.data.data.models.data)
        toast.success('模型列表加载成功 🎉')
      } else {
        toast.error('未获取到模型列表')
      }
    } catch (error) {
      toast.error('加载模型列表失败')
    } finally {
      setModelLoading(false)
    }
  }

  // 保存Provider信息
  const onProviderSubmit = async (values: ProviderFormValues) => {
    if (isEditMode) {
      await updateProvider({ ...values, id: id! })
      toast.success('更新供应商成功')
    } else {
      id = await addNewProvider({ ...values })
      toast.success('新增供应商成功')
    }
  }

  // 保存Model信息
  const onModelSubmit = async (values: ModelFormValues) => {
    toast.success(`保存模型: ${values.modelName}`)
    await loadModelsById(id!)
  }

  if (loading) return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-56" />
      <div className="rounded-lg border border-border/50 p-5 space-y-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/settings/model')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回供应商列表
      </button>

      {/* ====== Provider信息表单 ====== */}
      <div>
        <h2 className="text-xl font-semibold">
          {isEditMode ? `编辑供应商: ${providerForm.getValues().name}` : '新增模型供应商'}
        </h2>
        {!isBuiltIn && (
          <p className="mt-1 text-xs text-amber-600">
            自定义模型供应商需要确保兼容 OpenAI SDK
          </p>
        )}
      </div>

      <Form {...providerForm}>
        <form onSubmit={providerForm.handleSubmit(onProviderSubmit)} className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">基本信息</h3>

            <FormField
              control={providerForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">名称</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground">API 地址</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground">API Key</FormLabel>
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
                  <FormLabel className="text-xs text-muted-foreground">类型</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="h-9 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={!providerForm.formState.isDirty} className="gap-1.5">
              <Save className="h-4 w-4" />
              {isEditMode ? '保存修改' : '保存创建'}
            </Button>
            <Button type="button" onClick={handleTest} variant="outline" disabled={testing} className="gap-1.5">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              测试连通性
            </Button>
          </div>
        </form>
      </Form>

      {/* ====== 模型管理 ====== */}
      <div className="rounded-lg border border-border/50 p-5 space-y-4">
        <h3 className="text-sm font-medium text-foreground">模型管理</h3>

        <Alert className="text-xs border-amber-200 bg-amber-50">
          <AlertDescription>
            请确保已经<b>保存供应商信息</b>以及通过<b>测试连通性</b>。
          </AlertDescription>
        </Alert>

        <ModelSelector providerId={id!} />

        {/* 已启用模型 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">已启用模型</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleModelLoad}
              disabled={modelLoading}
              className="h-7 text-xs gap-1"
            >
              {modelLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              加载模型列表
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {models && models.length > 0 ? (
              models.map(model => (
                <span
                  key={model.id}
                  className="inline-flex items-center gap-1 rounded-md bg-primary-light px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {model.model_name}
                  <button
                    type="button"
                    onClick={() => handelDelete(model.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-muted-foreground/60">暂无已启用模型</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderForm
