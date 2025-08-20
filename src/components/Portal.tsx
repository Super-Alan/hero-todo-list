'use client'

import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
  children: ReactNode
  targetId?: string
}

const Portal: React.FC<PortalProps> = ({ children, targetId = 'portal-root' }) => {
  const [mounted, setMounted] = useState(false)
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let element = document.getElementById(targetId)
    
    if (!element) {
      element = document.createElement('div')
      element.id = targetId
      document.body.appendChild(element)
    }
    
    setPortalElement(element)
    setMounted(true)

    return () => {
      // 清理时不删除portal容器，可能被其他组件使用
    }
  }, [targetId])

  if (!mounted || !portalElement) {
    return null
  }

  return createPortal(children, portalElement)
}

export default Portal