import { CombinedMatcher, Irregex } from './irregex.ts'
import { assertEquals } from '@std/assert'
import { AnchorMe } from './matchers/anchorme.ts'
import { DateMatcher } from './matchers/date.ts'
import { Ipv4Matcher } from './matchers/ipv4.ts'
import { WordMatcher } from './matchers/word.ts'

Deno.test('DateMatcher', async (t) => {
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
	await t.step('word matcher', async (t) => {
		await t.step('replace', () => {
			const matcher = new WordMatcher('en-US')
			const input = 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
			const replacer = '($<abbr>)'
			const expected = '(Mon), (Tue), (Wed), (Thu), (Fri), (Sat), (Sun)'

			for (let i = 0; i < 2; ++i) {
				assertEquals(matcher[Symbol.replace](input, replacer), expected)
			}
		})
		await t.step('match', () => {
			const matcher = new WordMatcher('zh-CN')
			const input = '此地无银三百两'
			const expected = ['此地', '无', '银', '三百', '两']

			for (let i = 0; i < 2; ++i) {
				assertEquals(matcher[Symbol.match](input), expected)
			}
		})
	})

	await t.step('IPv4 matcher', async (t) => {
		await t.step('match', () => {
			const matcher = new Ipv4Matcher()
			const input = '192.168.1.1\n999.999.999.999\n255.255.255.255'
			const expected = ['192.168.1.1', '255.255.255.255']

			for (let i = 0; i < 2; ++i) {
				assertEquals(matcher[Symbol.match](input), expected)
			}
		})
	})

	await t.step('CombinedMatcher', async (t) => {
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

Deno.test('parity with RegExp', async (t) => {
	class RegexWrapper extends Irregex {
		re: RegExp

		constructor(re: RegExp) {
			super()
			this.re = new RegExp(re.source, re.flags)
			this.trackLastIndex = [this.re]
		}

		getMatch(str: string) {
			return this.re.exec(str)
		}
	}

	await t.step('replace', async (t) => {
		await t.step('named group', () => {
			const re = /(?<id>(a))(b)/g
			const wrapped = new RegexWrapper(re)
			const str = 'ab!ab!ab'
			const replacement = "[$1$2$`$'$<id>$<no>$&$$]"

			for (let i = 0; i < 2; ++i) {
				assertEquals(
					re[Symbol.replace](str, replacement),
					wrapped[Symbol.replace](str, replacement),
				)
			}
		})

		await t.step('no named group', () => {
			const re = /((a))(b)/g
			const wrapped = new RegexWrapper(re)
			const str = 'ab!ab!ab'
			const replacement = "[$1$2$`$'$<id>$<no>$&$$]"

			for (let i = 0; i < 10; ++i) {
				assertEquals(
					re[Symbol.replace](str, replacement),
					wrapped[Symbol.replace](str, replacement),
				)
			}
		})
	})

	await t.step('split', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!'.repeat(1000)

		for (const limit of [undefined, null, 'a', '9', 0, 1, 100, 10000, -1, -Infinity, Infinity, NaN]) {
			for (let i = 0; i < 10; ++i) {
				assertEquals(
					wrapped[Symbol.split](str, limit as number),
					re[Symbol.split](str, limit as number),
				)
			}
		}
	})

	await t.step('match', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!ab!ab'

		for (let i = 0; i < 10; ++i) {
			assertEquals(
				wrapped[Symbol.match](str),
				re[Symbol.match](str),
			)
		}
	})

	await t.step('search', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!ab!ab'

		for (let i = 0; i < 10; ++i) {
			assertEquals(
				wrapped[Symbol.search](str),
				re[Symbol.search](str),
			)
		}
	})

	await t.step('matchAll', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!ab!ab'

		for (let i = 0; i < 10; ++i) {
			assertEquals(
				[...wrapped[Symbol.matchAll](str)],
				[...re[Symbol.matchAll](str)],
			)
		}
	})

	await t.step('test', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!ab!ab'

		for (let i = 0; i < 10; ++i) {
			assertEquals(
				wrapped.test(str),
				re.test(str),
			)
		}
	})

	await t.step('exec', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!ab!ab'

		for (let i = 0; i < 10; ++i) {
			assertEquals(
				wrapped.exec(str),
				re.exec(str),
			)
		}
	})
})

Deno.test('AnchorMe', async (t) => {
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

Deno.test('CombinedMatcher', () => {
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
