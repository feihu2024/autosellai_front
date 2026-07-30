/**
 * 跨端存储封装
 *
 * 统一 localStorage 接口，底层使用 uni.getStorageSync / uni.setStorageSync
 * 确保在 H5 和微信小程序中行为一致。
 */

export const storage = {
  /**
   * 读取字符串（对应 localStorage.getItem）
   */
  getItem(key: string): string | null {
    try {
      const value = uni.getStorageSync(key)
      if (value === '' || value === null || value === undefined) {
        return null
      }
      return String(value)
    } catch {
      return null
    }
  },

  /**
   * 写入字符串（对应 localStorage.setItem）
   */
  setItem(key: string, value: string): void {
    try {
      uni.setStorageSync(key, value)
    } catch {
      // 存储不可用时静默失败
    }
  },

  /**
   * 删除（对应 localStorage.removeItem）
   */
  removeItem(key: string): void {
    try {
      uni.removeStorageSync(key)
    } catch {
      // ignore
    }
  },

  /**
   * 读取对象（自动 JSON 解析）
   */
  getObject<T = any>(key: string): T | null {
    const raw = this.getItem(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  /**
   * 写入对象（自动 JSON 序列化）
   */
  setObject(key: string, value: any): void {
    try {
      this.setItem(key, JSON.stringify(value))
    } catch {
      // ignore
    }
  },
}

/**
 * localStorage 兼容代理
 *
 * 将 uni storage 包装成与 Web localStorage 完全一致的接口，
 * 这样从原项目迁移的代码可以无修改地使用 localStorage.getItem / setItem 等。
 */
export const localStorageCompat: Storage = {
  getItem(key: string): string | null {
    return storage.getItem(key)
  },
  setItem(key: string, value: string): void {
    storage.setItem(key, value)
  },
  removeItem(key: string): void {
    storage.removeItem(key)
  },
  clear(): void {
    try {
      uni.clearStorageSync()
    } catch {
      // ignore
    }
  },
  key(_index: number): string | null {
    // 小程序无此 API，返回 null
    return null
  },
  get length(): number {
    try {
      const info = uni.getStorageInfoSync()
      return info.keys.length
    } catch {
      return 0
    }
  },
}
