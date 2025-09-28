import { Irregex, Matcher } from '../src/irregex.ts'
import { assertEquals, assertInstanceOf, unreachable } from '@std/assert'
import { RegexWrapper } from './_testUtils.ts'

Deno.test('never match', async (t) => {
	for (
		const [name, NeverMatcher] of [
			[
				'basic version',
				class NeverMatcher extends Irregex {
					protected override getMatch() {
						return null
					}
				},
			],
			[
				'fromIter version',
				class NeverMatcher extends Irregex {
					protected override getMatch() {
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
		protected override trackLastIndex = [this.#re]

		protected override getMatch(str: string) {
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

	await t.step('fromIter iterated/cursor tracking of lastIndex', () => {
		const ir = new (class extends Irregex {
			#re = /./g
			protected override trackLastIndex = [this.#re]
			protected override getMatch(str: string) {
				return this.fromIter(str, function* () {
					for (const x of str.matchAll(this.#re)) {
						yield x
					}
				})
			}
		})()

		const str = 'abc'

		const next = () => ir.exec(str)?.[0] ?? null

		assertEquals(next(), 'a')
		assertEquals(next(), 'b')
		assertEquals(next(), 'c')
		assertEquals(next(), null)

		assertEquals(next(), 'a')
		assertEquals(next(), 'b')
		assertEquals(next(), 'c')
		assertEquals(next(), null)

		ir.lastIndex = 2
		assertEquals(next(), 'c')
		ir.lastIndex = 1
		assertEquals(next(), 'b')
		ir.lastIndex = 500
		assertEquals(next(), null)
		ir.lastIndex = 0
		assertEquals(next(), 'a')
	})
})
