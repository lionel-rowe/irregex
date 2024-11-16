import { assertEquals } from '@std/assert/equals'
import { WordMatcher } from '../../src/matchers/word.ts'

Deno.test(WordMatcher.name, async (t) => {
	await t.step(Symbol.replace.description!, () => {
		const matcher = new WordMatcher('en-US')
		const input = 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
		const replacer = '($<abbr>)'
		const expected = '(Mon), (Tue), (Wed), (Thu), (Fri), (Sat), (Sun)'

		for (let i = 0; i < 2; ++i) {
			assertEquals(matcher[Symbol.replace](input, replacer), expected)
		}
	})
	await t.step(Symbol.match.description!, () => {
		const matcher = new WordMatcher('zh-CN')
		const input = '此地无银三百两'
		const expected = ['此地', '无', '银', '三百', '两']

		for (let i = 0; i < 2; ++i) {
			assertEquals(matcher[Symbol.match](input), expected)
		}
	})
})
