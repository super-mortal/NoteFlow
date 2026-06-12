import type { ReactNode, FC } from 'react'
import { Toaster } from 'react-hot-toast'

interface RootLayoutProps {
  children: ReactNode
}

export const metadata = {
  title: 'NoteFlow - 视频笔记生成器',
  description: '通过视频链接结合大模型自动生成对应的笔记',
}

const RootLayout: FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen flex-col bg-muted font-sans text-foreground">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}

export default RootLayout
