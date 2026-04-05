import { describe, it, expect } from 'vitest'
import { parseFontSize, textMayContainEmoji, clearMeasurementCaches } from '../measurement'

describe('parseFontSize', () => {
  it('should extract font size from px font string', () => {
    expect(parseFontSize('16px Arial')).toBe(16)
    expect(parseFontSize('24px sans-serif')).toBe(24)
    expect(parseFontSize('12.5px monospace')).toBeCloseTo(12.5, 5)
  })

  it('should handle font strings with various formats', () => {
    expect(parseFontSize('bold 18px Georgia')).toBe(18)
    expect(parseFontSize('italic 14px/1.5 "Times New Roman"')).toBe(14)
  })

  it('should return 16 as default for unparseable fonts', () => {
    expect(parseFontSize('Arial')).toBe(16)
    expect(parseFontSize('')).toBe(16)
    expect(parseFontSize('invalid')).toBe(16)
  })

  it('should handle integer and decimal sizes correctly', () => {
    expect(parseFontSize('10px')).toBe(10)
    expect(parseFontSize('10.0px')).toBe(10)
    expect(parseFontSize('10.123px')).toBeCloseTo(10.123, 5)
  })
})

describe('textMayContainEmoji', () => {
  it('should return true for strings with emoji', () => {
    expect(textMayContainEmoji('Hello 😀')).toBe(true)
    expect(textMayContainEmoji('🎉🎊')).toBe(true)
    expect(textMayContainEmoji('Test 🚀')).toBe(true)
  })

  it('should return true for strings with emoji modifiers', () => {
    expect(textMayContainEmoji('flag 🏳️')).toBe(true)
    expect(textMayContainEmoji('skin tone 👋🏽')).toBe(true)
  })

  it('should return false for plain ASCII text', () => {
    expect(textMayContainEmoji('hello world')).toBe(false)
    expect(textMayContainEmoji('12345')).toBe(false)
    expect(textMayContainEmoji('!@#$%')).toBe(false)
  })

  it('should return false for CJK text without emoji', () => {
    expect(textMayContainEmoji('你好世界')).toBe(false)
    expect(textMayContainEmoji('こんにちは')).toBe(false)
  })
})

describe('clearMeasurementCaches', () => {
  it('should not throw when called', () => {
    expect(() => clearMeasurementCaches()).not.toThrow()
  })
})
