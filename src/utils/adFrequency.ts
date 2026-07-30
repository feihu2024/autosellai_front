/**
 * 广告曝光频次控制工具（跨端版本）
 *
 * 原版使用 localStorage，这里改用 uni storage 封装。
 *
 * 存储结构：key = `ad_freq_{trigger_key}`
 * 值 = {"date":"2026-07-28","count":3,"lastTs":1722146400000}
 */

import { storage } from './storage'

interface FreqRecord {
  date: string  // YYYY-MM-DD
  count: number // 今日已曝光次数
  lastTs: number // 上次曝光的时间戳(ms)
}

/** 获取今天的日期字符串 */
function getTodayStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 读取某个 trigger_key 的频次记录 */
function readRecord(triggerKey: string): FreqRecord | null {
  return storage.getObject<FreqRecord>(`ad_freq_${triggerKey}`)
}

/** 写入频次记录 */
function writeRecord(triggerKey: string, record: FreqRecord): void {
  storage.setObject(`ad_freq_${triggerKey}`, record)
}

/**
 * 获取今日已曝光次数
 */
export function getTodayCount(triggerKey: string): number {
  const rec = readRecord(triggerKey)
  if (!rec) return 0
  if (rec.date !== getTodayStr()) return 0
  return rec.count
}

/**
 * 判断广告是否可以展示
 *
 * @param triggerKey 触发点标识
 * @param maxDaily 单日最大曝光次数（null/0 = 不限制）
 * @param minInterval 最小间隔秒数（null/0 = 不限制）
 * @returns { canShow: boolean, reason?: string }
 */
export function canShow(
  triggerKey: string,
  maxDaily: number | null | undefined,
  minInterval: number | null | undefined,
): { canShow: boolean; reason?: string } {
  // 不限制频次
  if (!maxDaily || maxDaily <= 0) {
    if (minInterval && minInterval > 0) {
      const rec = readRecord(triggerKey)
      if (rec && rec.date === getTodayStr()) {
        const elapsed = (Date.now() - rec.lastTs) / 1000
        if (elapsed < minInterval) {
          return { canShow: false, reason: `操作过于频繁，请 ${Math.ceil(minInterval - elapsed)} 秒后再试` }
        }
      }
    }
    return { canShow: true }
  }

  const count = getTodayCount(triggerKey)
  if (count >= maxDaily) {
    return { canShow: false, reason: `今日次数已达上限（${maxDaily}次）` }
  }

  if (minInterval && minInterval > 0) {
    const rec = readRecord(triggerKey)
    if (rec && rec.date === getTodayStr()) {
      const elapsed = (Date.now() - rec.lastTs) / 1000
      if (elapsed < minInterval) {
        return { canShow: false, reason: `操作过于频繁，请 ${Math.ceil(minInterval - elapsed)} 秒后再试` }
      }
    }
  }

  return { canShow: true }
}

/**
 * 记录一次曝光（展示成功后调用）
 */
export function recordExposure(triggerKey: string): void {
  const today = getTodayStr()
  let rec = readRecord(triggerKey)
  if (!rec || rec.date !== today) {
    rec = { date: today, count: 0, lastTs: 0 }
  }
  rec.count += 1
  rec.lastTs = Date.now()
  writeRecord(triggerKey, rec)
}

/**
 * 重置某个 trigger_key 的频次记录（调试用）
 */
export function resetFrequency(triggerKey: string): void {
  storage.removeItem(`ad_freq_${triggerKey}`)
}
