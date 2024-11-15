import { assertEquals } from '@std/assert/equals'
import { assertAllEqual, RegexWrapper } from './_testUtils.ts'

Deno.test(Symbol.replace.description!, async (t) => {
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

Deno.test(Symbol.split.description!, async (t) => {
	await t.step('basic', () => {
		const re = /b/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertAllEqual(
			['a', 'c'],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('basic (at start)', () => {
		const re = /a/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertAllEqual(
			['', 'bc'],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('basic (at end)', () => {
		const re = /c/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertAllEqual(
			['ab', ''],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('basic (every char)', () => {
		const re = /./g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertAllEqual(
			['', '', '', ''],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty pattern', () => {
		const re = /(?:)/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertAllEqual(
			['a', 'b', 'c'],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('unmatched', () => {
		const re = /d/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertAllEqual(
			['abc'],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('capture groups', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertEquals(
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty capture groups', () => {
		const re = /(()())/g
		const wrapped = new RegexWrapper(re)
		const str = 'abc'

		assertEquals(
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty input string - unmatched', () => {
		const re = /x/g
		const wrapped = new RegexWrapper(re)
		const str = ''

		assertAllEqual(
			[''],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty input string - unmatched, zero-length', () => {
		const re = /\b/g
		const wrapped = new RegexWrapper(re)
		const str = ''

		assertAllEqual(
			[''],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty input string - unmatched, zero-length with capture groups', () => {
		const re = /(\b)/g
		const wrapped = new RegexWrapper(re)
		const str = ''

		assertAllEqual(
			[''],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty input string - matched, zero-length', () => {
		const re = /(?:)/g
		const wrapped = new RegexWrapper(re)
		const str = ''

		assertAllEqual(
			[],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('empty input string - matched, zero-length with capture groups', () => {
		const re = /(()())/g
		const wrapped = new RegexWrapper(re)
		const str = ''

		assertAllEqual(
			[],
			re[Symbol.split](str),
			wrapped[Symbol.split](str),
		)
	})

	await t.step('with limit param', () => {
		const re = /(?<id>(a))(b)/g
		const wrapped = new RegexWrapper(re)
		const str = 'ab!'.repeat(1000)

		for (const limit of [undefined, null, 'a', '9', 0, 1, 7.5, 100, 10000, -1, -Infinity, Infinity, NaN]) {
			for (let i = 0; i < 10; ++i) {
				assertEquals(
					re[Symbol.split](str, limit as number),
					wrapped[Symbol.split](str, limit as number),
				)
			}
		}
	})
})

Deno.test(Symbol.match.description!, () => {
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

Deno.test(Symbol.search.description!, () => {
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

Deno.test(Symbol.matchAll.description!, () => {
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

Deno.test(RegExp.prototype.test.name, () => {
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

Deno.test(RegExp.prototype.exec.name, async (t) => {
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

Deno.test('combined', async (t) => {
	const res = [
		/a/g,
		/./gu,
		/(()())/g,
		/(?:)/g,
		/(?<id>(a))(b)/g,
	]

	const strs = ['', 'a', 'ab', 'abc']

	const lastIndexes = [0, 1, 100]

	const methods = [
		Symbol.match,
		Symbol.matchAll,
		Symbol.search,
		Symbol.split,
		'exec',
		'test',
	] as const

	for (const re of res) {
		for (const str of strs) {
			for (const method of methods) {
				for (const lastIndex of lastIndexes) {
					const wrapped = new RegexWrapper(re)
					re.lastIndex = lastIndex
					wrapped.lastIndex = lastIndex

					let w = wrapped[method](str)
					let r = re[method](str)

					if (w instanceof Iterator && r instanceof Iterator) {
						w = [...w]
						r = [...r]
					}

					await t.step(
						`${String(method)} for ${re} on ${JSON.stringify(str)} (lastIndex: ${lastIndex})`,
						() => {
							assertEquals(w, r)

							assertEquals(
								wrapped.lastIndex,
								re.lastIndex,
							)
						},
					)
				}
			}
		}
	}

	const replacements = ['', 'x', '$1', '$<id>']

	for (const re of res) {
		for (const str of strs) {
			for (const replacement of replacements) {
				for (const lastIndex of lastIndexes) {
					const wrapped = new RegexWrapper(re)
					re.lastIndex = lastIndex
					wrapped.lastIndex = lastIndex

					const w = wrapped[Symbol.replace](str, replacement)
					const r = re[Symbol.replace](str, replacement)

					await t.step(
						`${String(Symbol.replace)} for ${re} => ${JSON.stringify(replacement)} on ${
							JSON.stringify(str)
						} (lastIndex: ${lastIndex})`,
						() => {
							assertEquals(w, r)

							assertEquals(
								wrapped.lastIndex,
								re.lastIndex,
							)
						},
					)
				}
			}
		}
	}
})
