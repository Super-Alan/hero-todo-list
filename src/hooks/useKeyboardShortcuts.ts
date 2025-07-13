import { useEffect } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果正在输入（input、textarea 等），跳过快捷键处理
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement).contentEditable === 'true'
      ) {
        return
      }

      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase()
        const ctrlMatch = (s.ctrlKey || false) === event.ctrlKey
        const metaMatch = (s.metaKey || false) === event.metaKey
        const shiftMatch = (s.shiftKey || false) === event.shiftKey
        const altMatch = (s.altKey || false) === event.altKey

        return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch
      })

      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

// 常用快捷键组合
export const createShortcuts = {
  // Ctrl+N 或 Cmd+N 快速添加任务
  quickAdd: (action: () => void): KeyboardShortcut => ({
    key: 'n',
    ctrlKey: true,
    metaKey: true, // Mac 上是 Cmd
    action
  }),

  // Escape 关闭或取消
  escape: (action: () => void): KeyboardShortcut => ({
    key: 'Escape',
    action
  }),

  // Enter 确认
  enter: (action: () => void): KeyboardShortcut => ({
    key: 'Enter',
    action
  }),

  // Ctrl+/ 或 Cmd+/ 显示快捷键帮助
  help: (action: () => void): KeyboardShortcut => ({
    key: '/',
    ctrlKey: true,
    metaKey: true,
    action
  }),

  // 数字键切换视图
  number: (num: number, action: () => void): KeyboardShortcut => ({
    key: num.toString(),
    action
  }),

  // Ctrl+F 或 Cmd+F 搜索
  search: (action: () => void): KeyboardShortcut => ({
    key: 'f',
    ctrlKey: true,
    metaKey: true,
    action
  }),

  // Ctrl+R 或 Cmd+R 刷新
  refresh: (action: () => void): KeyboardShortcut => ({
    key: 'r',
    ctrlKey: true,
    metaKey: true,
    action
  })
}

// 检测操作系统
export const isMac = () => {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

// 格式化快捷键显示
export const formatShortcut = (shortcut: Partial<KeyboardShortcut>) => {
  const keys = []
  
  if (shortcut.ctrlKey && !isMac()) keys.push('Ctrl')
  if (shortcut.metaKey && isMac()) keys.push('⌘')
  if (shortcut.ctrlKey && isMac()) keys.push('Ctrl')
  if (shortcut.altKey) keys.push(isMac() ? '⌥' : 'Alt')
  if (shortcut.shiftKey) keys.push(isMac() ? '⇧' : 'Shift')
  
  if (shortcut.key) {
    keys.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
  }
  
  return keys.join(isMac() ? ' ' : ' + ')
} 