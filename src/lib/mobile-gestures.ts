// 移动端手势支持库
import React from 'react'

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

interface GestureConfig {
  minSwipeDistance?: number
  maxSwipeTime?: number
  minTapTime?: number
  maxTapTime?: number
}

interface GestureCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: () => void
  onPinchStart?: (distance: number) => void
  onPinchMove?: (distance: number, scale: number) => void
  onPinchEnd?: (scale: number) => void
}

export class MobileGestureHandler {
  private element: HTMLElement
  private config: GestureConfig
  private callbacks: GestureCallbacks
  private touchStart: TouchPoint | null = null
  private touchEnd: TouchPoint | null = null
  private longPressTimer: NodeJS.Timeout | null = null
  private isLongPress = false
  private initialPinchDistance = 0
  private currentScale = 1

  constructor(
    element: HTMLElement,
    callbacks: GestureCallbacks,
    config: GestureConfig = {}
  ) {
    this.element = element
    this.callbacks = callbacks
    this.config = {
      minSwipeDistance: 50,
      maxSwipeTime: 300,
      minTapTime: 50,
      maxTapTime: 300,
      ...config
    }

    this.init()
  }

  private init() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false })
  }

  private handleTouchStart(event: TouchEvent) {
    // 检查触摸目标是否是交互元素（按钮、输入框等）
    const target = event.target as HTMLElement
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'INPUT' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'SELECT' || 
                                target.tagName === 'A' ||
                                target.closest('button') ||
                                target.closest('input') ||
                                target.closest('textarea') ||
                                target.closest('select') ||
                                target.closest('a')
    
    // 如果不是交互元素，才阻止默认行为
    if (!isInteractiveElement) {
      event.preventDefault()
    }
    
    const touch = event.touches[0]
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }
    this.touchEnd = null
    this.isLongPress = false

    // 设置长按定时器
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true
      this.callbacks.onLongPress?.()
    }, 500)

    // 处理双指缩放手势
    if (event.touches.length === 2) {
      this.initialPinchDistance = this.getDistance(event.touches[0], event.touches[1])
      this.callbacks.onPinchStart?.(this.initialPinchDistance)
    }
  }

  private handleTouchMove(event: TouchEvent) {
    // 检查触摸目标是否是交互元素
    const target = event.target as HTMLElement
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'INPUT' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'SELECT' || 
                                target.tagName === 'A' ||
                                target.closest('button') ||
                                target.closest('input') ||
                                target.closest('textarea') ||
                                target.closest('select') ||
                                target.closest('a')
    
    // 如果不是交互元素，才阻止默认行为
    if (!isInteractiveElement) {
      event.preventDefault()
    }

    if (event.touches.length === 2) {
      // 处理双指缩放
      const currentDistance = this.getDistance(event.touches[0], event.touches[1])
      const scale = currentDistance / this.initialPinchDistance
      this.currentScale = scale
      this.callbacks.onPinchMove?.(currentDistance, scale)
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    // 检查触摸目标是否是交互元素
    const target = event.target as HTMLElement
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'INPUT' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'SELECT' || 
                                target.tagName === 'A' ||
                                target.closest('button') ||
                                target.closest('input') ||
                                target.closest('textarea') ||
                                target.closest('select') ||
                                target.closest('a')
    
    // 如果不是交互元素，才阻止默认行为
    if (!isInteractiveElement) {
      event.preventDefault()
    }

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    if (event.touches.length === 0 && this.initialPinchDistance > 0) {
      // 结束双指缩放
      this.callbacks.onPinchEnd?.(this.currentScale)
      this.initialPinchDistance = 0
      this.currentScale = 1
    }

    if (!this.touchStart) return

    const touch = event.changedTouches[0]
    this.touchEnd = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }

    this.detectGesture()
  }

  private handleTouchCancel(event: TouchEvent) {
    // 检查触摸目标是否是交互元素
    const target = event.target as HTMLElement
    const isInteractiveElement = target.tagName === 'BUTTON' || 
                                target.tagName === 'INPUT' || 
                                target.tagName === 'TEXTAREA' || 
                                target.tagName === 'SELECT' || 
                                target.tagName === 'A' ||
                                target.closest('button') ||
                                target.closest('input') ||
                                target.closest('textarea') ||
                                target.closest('select') ||
                                target.closest('a')
    
    // 如果不是交互元素，才阻止默认行为
    if (!isInteractiveElement) {
      event.preventDefault()
    }
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    this.touchStart = null
    this.touchEnd = null
    this.isLongPress = false
    this.initialPinchDistance = 0
    this.currentScale = 1
  }

  private detectGesture() {
    if (!this.touchStart || !this.touchEnd) return

    const deltaX = this.touchEnd.x - this.touchStart.x
    const deltaY = this.touchEnd.y - this.touchStart.y
    const deltaTime = this.touchEnd.timestamp - this.touchStart.timestamp

    // 检测滑动
    if (deltaTime <= this.config.maxSwipeTime!) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance >= this.config.minSwipeDistance!) {
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI
        
        if (angle >= -45 && angle <= 45) {
          // 向右滑动
          this.callbacks.onSwipeRight?.()
        } else if (angle >= 135 || angle <= -135) {
          // 向左滑动
          this.callbacks.onSwipeLeft?.()
        } else if (angle > 45 && angle < 135) {
          // 向下滑动
          this.callbacks.onSwipeDown?.()
        } else {
          // 向上滑动
          this.callbacks.onSwipeUp?.()
        }
        return
      }
    }

    // 检测点击
    if (deltaTime >= this.config.minTapTime! && 
        deltaTime <= this.config.maxTapTime! && 
        !this.isLongPress) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (distance < 10) {
        this.callbacks.onTap?.()
      }
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const deltaX = touch1.clientX - touch2.clientX
    const deltaY = touch1.clientY - touch2.clientY
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
    }
  }
}

// React Hook for mobile gestures
export function useMobileGestures(
  elementRef: React.RefObject<HTMLElement>,
  callbacks: GestureCallbacks,
  config?: GestureConfig
) {
  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const gestureHandler = new MobileGestureHandler(element, callbacks, config)

    return () => {
      gestureHandler.destroy()
    }
  }, [elementRef, callbacks, config])
}

// 移动端工具函数
export const mobileUtils = {
  // 检测是否为移动设备
  isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  // 检测是否为触摸设备
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  },

  // 获取视口尺寸
  getViewportSize() {
    if (typeof window === 'undefined') return { width: 0, height: 0 }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  },

  // 检测设备方向
  getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') return 'portrait'
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  },

  // 添加视口变化监听
  onViewportChange(callback: (orientation: 'portrait' | 'landscape') => void) {
    if (typeof window === 'undefined') return () => {}

    const handleResize = () => {
      callback(this.getOrientation())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  },

  // 防止双击缩放
  preventDoubleTapZoom() {
    if (typeof window === 'undefined') return

    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)
  },

  // 设置视口缩放
  setViewportScale(scale: number = 1) {
    if (typeof window === 'undefined') return

    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', `width=device-width, initial-scale=${scale}, maximum-scale=${scale}, user-scalable=no`)
    }
  }
}