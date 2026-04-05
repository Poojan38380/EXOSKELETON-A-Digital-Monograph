import { describe, it, expect } from 'vitest'
import { isCJK, kinsokuStart, kinsokuEnd, endsWithClosingQuote, normalizeWhitespaceNormal } from '../analysis'

describe('isCJK', () => {
  it('should return true for Chinese characters', () => {
    expect(isCJK('中')).toBe(true)
    expect(isCJK('文')).toBe(true)
    expect(isCJK('你好')).toBe(true)
  })

  it('should return true for Japanese characters', () => {
    expect(isCJK('あ')).toBe(true) // Hiragana
    expect(isCJK('ア')).toBe(true) // Katakana
    expect(isCJK('漢')).toBe(true) // Kanji
  })

  it('should return true for Korean characters', () => {
    expect(isCJK('한')).toBe(true)
    expect(isCJK('글')).toBe(true)
  })

  it('should return false for ASCII text', () => {
    expect(isCJK('hello')).toBe(false)
    expect(isCJK('123')).toBe(false)
    expect(isCJK('!@#')).toBe(false)
  })

  it('should return false for emoji', () => {
    expect(isCJK('😀')).toBe(false)
    expect(isCJK('🎉')).toBe(false)
  })

  it('should return true if any character in string is CJK', () => {
    expect(isCJK('hello 世界')).toBe(true)
    expect(isCJK('test テスト')).toBe(true)
  })
})

describe('kinsoku characters', () => {
  it('should have kinsokuStart characters (cannot start a line)', () => {
    expect(kinsokuStart.has('。')).toBe(true)
    expect(kinsokuStart.has('、')).toBe(true)
    expect(kinsokuStart.has('）')).toBe(true)
    expect(kinsokuStart.has('」')).toBe(true)
  })

  it('should have kinsokuEnd characters (cannot end a line)', () => {
    expect(kinsokuEnd.has('（')).toBe(true)
    expect(kinsokuEnd.has('【')).toBe(true)
    expect(kinsokuEnd.has('"')).toBe(true)
    expect(kinsokuEnd.has('"')).toBe(true)
  })
})

describe('endsWithClosingQuote', () => {
  it('should return true for strings ending with Unicode closing quotes', () => {
    expect(endsWithClosingQuote('Hello\u201D')).toBe(true)   // U+201D RIGHT DOUBLE QUOTATION MARK
    expect(endsWithClosingQuote('World\u2019')).toBe(true)   // U+2019 RIGHT SINGLE QUOTATION MARK
    expect(endsWithClosingQuote('Test\u00BB')).toBe(true)    // U+00BB RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK
  })

  it('should return true for strings with closing quote after punctuation', () => {
    expect(endsWithClosingQuote('Hello.\u201D')).toBe(true)
    expect(endsWithClosingQuote('Test,\u201D')).toBe(true)
  })

  it('should return false for strings not ending with closing quotes', () => {
    expect(endsWithClosingQuote('Hello')).toBe(false)
    expect(endsWithClosingQuote('World(')).toBe(false)
    expect(endsWithClosingQuote('"Test')).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(endsWithClosingQuote('')).toBe(false)
  })
})

describe('normalizeWhitespaceNormal', () => {
  it('should collapse multiple spaces to single space', () => {
    expect(normalizeWhitespaceNormal('hello   world')).toBe('hello world')
  })

  it('should trim leading and trailing spaces', () => {
    expect(normalizeWhitespaceNormal('  hello  ')).toBe('hello')
  })

  it('should replace tabs and newlines with spaces', () => {
    expect(normalizeWhitespaceNormal('hello\tworld')).toBe('hello world')
    expect(normalizeWhitespaceNormal('hello\nworld')).toBe('hello world')
  })

  it('should not modify strings that are already normalized', () => {
    expect(normalizeWhitespaceNormal('hello world')).toBe('hello world')
    expect(normalizeWhitespaceNormal('test')).toBe('test')
  })

  it('should handle empty strings', () => {
    expect(normalizeWhitespaceNormal('')).toBe('')
  })

  it('should handle strings with only whitespace', () => {
    expect(normalizeWhitespaceNormal('   ')).toBe('')
    expect(normalizeWhitespaceNormal('\t\n')).toBe('')
  })
})
