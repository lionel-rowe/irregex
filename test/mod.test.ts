import { CombinedMatcher, Irregex, Matcher } from '../src/irregex.ts'
import { assertEquals, assertInstanceOf, unreachable } from '@std/assert'
import { AnchorMe } from '../src/matchers/anchorme.ts'
import { DateMatcher } from '../src/matchers/date.ts'
import { Ipv4Matcher } from '../src/matchers/ipv4.ts'
import { WordMatcher } from '../src/matchers/word.ts'
import { RegexWrapper } from './_testUtils.ts'

Deno.test(DateMatcher.name, async (t) => {
	await t.step('OK, hyphens', () => {
		assertEquals(new DateMatcher().test('2001-01-01'), true)
	})
	await t.step('OK, slashes', () => {
		assertEquals(new DateMatcher().test('2002/02/02'), true)
	})

	await t.step('no match, mixed ', () => {
		assertEquals(new DateMatcher().test('2003-03/03'), false)
	})
	await t.step('no match, day segment too long', () => {
		assertEquals(new DateMatcher().test('2004-04-004'), false)
	})
	await t.step('no match, year segment too long', () => {
		assertEquals(new DateMatcher().test('20005-05-05'), false)
	})

	await t.step('doesn’t exist', () => {
		assertEquals(new DateMatcher().test('1999-99-99'), false)
	})

	await t.step('doesn’t exist, not a leapyear', () => {
		assertEquals(new DateMatcher().test('1999-02-29'), false)
	})
	await t.step('OK, leapyear', () => {
		assertEquals(new DateMatcher().test('2000-02-29'), true)
	})
})

Deno.test('readme', async (t) => {
	await t.step(WordMatcher.name, async (t) => {
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

	await t.step(Ipv4Matcher.name, async (t) => {
		await t.step('match', () => {
			const matcher = new Ipv4Matcher()
			const input = '192.168.1.1\n999.999.999.999\n255.255.255.255'
			const expected = ['192.168.1.1', '255.255.255.255']

			for (let i = 0; i < 2; ++i) {
				assertEquals(matcher[Symbol.match](input), expected)
			}
		})
	})

	await t.step(CombinedMatcher.name, async (t) => {
		await t.step('different kinds of matchers', () => {
			const matcher = new CombinedMatcher([
				new WordMatcher('en-US'),
				new Ipv4Matcher(),
				/!/g,
			])

			const input = 'One two three 1 2 3 192.168.1.1 999.999.999.999 255.255.255.255 five!'
			const expected = ['One', 'two', 'three', '192.168.1.1', '255.255.255.255', 'five', '!']

			assertEquals(matcher[Symbol.match](input), expected)
		})

		await t.step('case sensitive and insensitive regexes', () => {
			const matcher = new CombinedMatcher([
				/a/g,
				/b/gi,
			])

			const input = 'a A b B'
			const expected = ['a', 'b', 'B']

			assertEquals(matcher[Symbol.match](input), expected)
		})
	})
})

Deno.test(AnchorMe.name, async (t) => {
	const input = `
		http://www.google.com
		wordpress.com/post.php?p=112
		not a link
		email@ex.com
		mailto:email@ex.com 
		file:///c:/directory/somefile.zip
	`

	await t.step('all reasons', () => {
		const actual = [...new AnchorMe()[Symbol.matchAll](input)].flat()
		assertEquals(actual, [
			'http://www.google.com',
			'wordpress.com/post.php?p=112',
			'email@ex.com',
			'mailto:email@ex.com',
			'file:///c:/directory/somefile.zip',
		])
	})

	for (
		const { reason, expect } of [
			{ reason: 'url' as const, expect: ['http://www.google.com', 'wordpress.com/post.php?p=112'] },
			{ reason: 'email' as const, expect: ['email@ex.com', 'mailto:email@ex.com'] },
			{ reason: 'file' as const, expect: ['file:///c:/directory/somefile.zip'] },
		]
	) {
		await t.step(reason, () => {
			const actual = [...new AnchorMe([reason])[Symbol.matchAll](input)].flat()
			assertEquals(actual, expect)
		})
	}
})

Deno.test(CombinedMatcher.name, () => {
	class NumberMatcher extends Irregex {
		constructor(public min: number, public max: number) {
			super()
			this.trackLastIndex = [this.re]
		}

		re = /\d+/g

		getMatch(str: string): RegExpExecArray | null {
			while (true) {
				const m = this.re.exec(str)
				if (m == null) return null
				const n = parseInt(m[0], 10)
				if (n < this.min || n > this.max) {
					continue
				}
				return m
			}
		}
	}

	const c = new CombinedMatcher([
		new AnchorMe(),
		new Ipv4Matcher(),
		new NumberMatcher(42, 888),
		/a/g,
		/b/g,
	])

	const input =
		'abcabc a.com a@b.com c:\\Users\\Me\\a.txt file:///a.txt /root/abc/b.txt 192.168.1.1 999.999.999.999 255.255.255.255 999 41 42 43 887 888 889'
	const expected = [
		'a',
		'b',
		'a',
		'b',
		'a.com',
		'a@b.com',
		'a',
		'file:///a.txt',
		'a',
		'b',
		'b',
		'192.168.1.1',
		'255.255.255.255',
		'42',
		'43',
		'887',
		'888',
	]

	for (let i = 0; i < 2; ++i) {
		assertEquals(
			c[Symbol.match](input),
			expected,
		)
	}
})

Deno.test('never match', async (t) => {
	for (
		const [name, NeverMatcher] of [
			[
				'basic version',
				class NeverMatcher extends Irregex {
					getMatch() {
						return null
					}
				},
			],
			[
				'fromIter version',
				class NeverMatcher extends Irregex {
					getMatch() {
						return this.fromIter('', () => [])
					}
				},
			],
		] as const
	) {
		await t.step(name, () => {
			const matcher = new NeverMatcher()
			const str = 'abc'

			for (let i = 0; i < 10; ++i) {
				assertEquals(matcher[Symbol.replace](str, 'xyz'), str)
				assertEquals(matcher[Symbol.match](str), null)
				assertEquals(matcher[Symbol.split](str), [str])
				assertEquals(matcher.test(str), false)
				assertEquals(matcher.exec(str), null)
				assertEquals(matcher[Symbol.search](str), -1)
				assertEquals([...matcher[Symbol.matchAll](str)], [])
			}
		})
	}
})

Deno.test('throw match', () => {
	class ThrowMatcherError extends Error {}

	class ThrowMatcher extends Irregex {
		#re = /./g
		override trackLastIndex = [this.#re]

		override getMatch(str: string) {
			if (this.lastIndex) throw new ThrowMatcherError()
			return this.#re.exec(str)
		}
	}

	const matcher = new ThrowMatcher()
	const str = 'abc'

	try {
		void [...matcher[Symbol.matchAll](str)]

		unreachable()
	} catch (e) {
		assertInstanceOf(e, ThrowMatcherError)
		assertEquals(matcher.lastIndex, 0)
	}
})

Deno.test('zero-length matches', async (t) => {
	const re = () => /(?:)/g

	async function assertRegExpParity(t: Deno.TestContext, fn: (matcher: Matcher) => void) {
		for (const matcher of [new RegexWrapper(re()), re()]) {
			await t.step(matcher.constructor.name, () => {
				fn(matcher)
			})
		}
	}

	await t.step(`advance lastIndex for ${Symbol.matchAll.description!}`, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			// this will form an infinite loop if lastIndex is not advanced
			const matches = [...matcher[Symbol.matchAll](str)].flat()
			assertEquals(matches, ['', '', '', ''])
			assertEquals(matcher.lastIndex, 0)
		})
	})

	await t.step(`doesn't advance lastIndex for ${Irregex.prototype.exec.name}`, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			const result = matcher.exec(str)
			assertEquals(result?.[0], '')
			assertEquals(result?.index, 0)
			assertEquals(matcher.lastIndex, 0)
		})
	})

	await t.step(`doesn't advance lastIndex for ${Irregex.prototype.test.name}`, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			const result = matcher.test(str)
			assertEquals(result, true)
			assertEquals(matcher.lastIndex, 0)
		})
	})

	await t.step(Symbol.search.description!, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			const n = matcher[Symbol.search](str)
			assertEquals(n, 0)
			assertEquals(matcher.lastIndex, 0)
		})
	})

	await t.step(Symbol.match.description!, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			// this will form an infinite loop if lastIndex is not advanced
			const matches = matcher[Symbol.match](str)
			assertEquals(matches, ['', '', '', ''])
			assertEquals(matcher.lastIndex, 0)
		})
	})

	await t.step(Symbol.split.description!, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			// this will form an infinite loop if lastIndex is not advanced
			const matches = matcher[Symbol.split](str)
			assertEquals(matches, ['a', 'b', 'c'])
			assertEquals(matcher.lastIndex, 0)
		})
	})

	await t.step(Symbol.replace.description!, async (t) => {
		await assertRegExpParity(t, (matcher) => {
			const str = 'abc'

			// this will form an infinite loop if lastIndex is not advanced
			const matches = matcher[Symbol.replace](str, 'X')
			assertEquals(matches, 'XaXbXcX')
			assertEquals(matcher.lastIndex, 0)
		})
	})
})
