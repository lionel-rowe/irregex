import { CombinedMatcher, Irregex } from 'irregex'
import { assertEquals } from 'std/assert/mod.ts'
import anchorme from 'https://esm.sh/v135/anchorme@3.0.8'

class WordMatcher extends Irregex {
	segmenter: Intl.Segmenter

	constructor(locale: string) {
		super()
		this.segmenter = new Intl.Segmenter(locale, { granularity: 'word' })
	}

	getMatch(str: string) {
		return this.fromIter(str, function* () {
			for (const segmentData of this.segmenter.segment(str)) {
				if (segmentData.isWordLike && /\p{L}/u.test(segmentData.segment)) {
					const arr: [string] = [segmentData.segment]

					yield Object.assign(arr, {
						...segmentData,
						groups: {
							abbr: segmentData.segment.match(/^.{0,3}/u)![0],
						},
					})
				}
			}
		})
	}
}

class Ipv4Matcher extends Irregex {
	re = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/g

	constructor() {
		super()
		this.trackLastIndex = [this.re]
	}

	getMatch(str: string): RegExpExecArray | null {
		while (true) {
			const m = this.re.exec(str)
			if (m == null) return null

			if (m.slice(1).every((x) => Number(x) < 256)) {
				return m
			}
		}
	}
}

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

function list(input: string): { start: number; end: number; string: string }[] {
	return anchorme.list(input, false)
}

Deno.test('CombinedMatcher', async (t) => {
	class AnchorMe extends Irregex {
		getMatch(str: string) {
			return this.fromIter(str, () =>
				list(str).map((x) =>
					Object.assign(
						[x.string] as [string],
						{ index: x.start, input: str },
					)
				))
		}
	}

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
