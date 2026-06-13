import ProviderCard from '@/components/Form/DownloaderForm/providerCard.tsx'
import { useEffect, useState } from 'react'
import { getDownloaderCookie } from '@/services/downloader'
import { videoPlatforms } from '@/constant/note.ts'

const Options = () => {
  const [cookieMap, setCookieMap] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchAll = async () => {
      const map: Record<string, boolean> = {}
      for (const p of videoPlatforms) {
        if (p.value === 'local') continue
        try {
          const res = await getDownloaderCookie(p.value)
          map[p.value] = !!res?.cookie
        } catch {
          map[p.value] = false
        }
      }
      setCookieMap(map)
    }
    fetchAll()
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs font-medium text-text-secondary">选择平台</div>
      <div className="grid grid-cols-1 gap-2.5">
        {videoPlatforms
          .filter(p => p.value !== 'local')
          .map((provider, index) => (
            <ProviderCard
              key={index}
              providerName={provider.label}
              Icon={provider.logo}
              id={provider.value}
              hasCookie={cookieMap[provider.value]}
            />
          ))}
      </div>
    </div>
  )
}

export default Options
