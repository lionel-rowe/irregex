import dedent from 'string-dedent'
import { assertEquals } from '@std/assert'
import { NormalizedMatcher } from './normalized.ts'

Deno.test(NormalizedMatcher.name, async (t) => {
	await t.step('`g` and `d` flags', () => {
		const matcher = new NormalizedMatcher({
			normalizers: [{
				selector: /\w{2}/g,
				replacer: () => '@',
			}],
			matcher: /(?<first>@)@*/gd,
		})

		const input = 'abcdef ghij kl'
		const matches = [...matcher[Symbol.matchAll](input)]

		assertEquals(matches.map((x) => [...x]), [['abcdef', 'ab'], ['ghij', 'gh'], ['kl', 'kl']])
		assertEquals(matches.map((x) => x.groups!), [{ first: 'ab' }, { first: 'gh' }, { first: 'kl' }])
		assertEquals(matches.map((x) => [...x.indices!]), [[[0, 6], [0, 2]], [[7, 11], [7, 9]], [[12, 14], [12, 14]]])
		assertEquals(matches.map((x) => x.indices!.groups!), [{ first: [0, 2] }, { first: [7, 9] }, {
			first: [12, 14],
		}])

		assertEquals(matcher[Symbol.replace](input, '[$&]'), '[abcdef] [ghij] [kl]')
	})

	await t.step('no flags', () => {
		const matcher = new NormalizedMatcher({
			normalizers: [{
				selector: /\w{2}/g,
				replacer: () => '@',
			}],
			matcher: /(?<first>@)@*/,
		})

		const input = 'abcdef ghij kl'
		const matches = [...matcher[Symbol.matchAll](input)]

		assertEquals(matches.map((x) => [...x]), [['abcdef', 'ab']])
		assertEquals(matches.map((x) => x.groups!), [{ first: 'ab' }])
		assertEquals(matches.map((x) => x.indices), [undefined])

		assertEquals(matcher[Symbol.replace](input, '[$&]'), '[abcdef] ghij kl')
	})

	await t.step('long text with diacritics', async (t) => {
		for (const form of ['NFC', 'NFD'] as const) {
			await t.step(form, () => {
				const input = dedent`
					Là chưa diễn và có ví có trợ định hán này cách hoàn dài gõ. Chế byte vì byte xử tiêu phẳng dụng tự hết hay consortium là này tính tiếng này u nhau mặc là. Ký trên bit số mặc đó nghe phiên cách được ra. Số đầu qof xử thêm ngày plane tiến. Chữ hai mặt người chuyên là quan của từ trị chia thì mã, các đa và mục là cũ.

					Nhóm v ngôn ngữ, từ một mà xử mềm không mặt chương số đảm viết nyrh gì hình ngữ chí. Lượng của bit tiếng ơ thuộc của trung nhiên hiệu bởi của thì chữ có thành nhật ta phồn hoặc. Nay bit các tương, được, do nhất để trong đích một các. Quốc phải ít sử nằm người phẳng phần.
				`.normalize(form)

				const WORD = 'người'.normalize(form)
				const MATCHER = /nguoi/g

				const matcher = new NormalizedMatcher({
					normalizers: [{
						selector: /(\p{L})\p{M}*/gu,
						replacer: (x) => x[1]!.normalize('NFD')[Symbol.iterator]().next().value!,
					}],
					matcher: MATCHER,
				})

				const result = [...matcher[Symbol.matchAll](input)]

				assertEquals(result.flat(), [WORD, WORD])

				assertEquals(result[0]!.index, input.indexOf(WORD))
				assertEquals(result[0]!.input, input)
				assertEquals(input.slice(result[0]!.index, result[0]!.index + WORD.length), WORD)

				assertEquals(result[1]!.index, input.indexOf(WORD, input.indexOf(WORD) + 1))
				assertEquals(result[1]!.input, input)
				assertEquals(input.slice(result[1]!.index, result[1]!.index + WORD.length), WORD)
			})
		}
	})

	await t.step('combined normalizations', () => {
		const input = 'người phẳng, người  phẳng, nguoi phang, nguoi  phang, người phẳng'

		const matcher = new NormalizedMatcher({
			normalizers: [
				{
					selector: /\s+/gu,
					replacer: () => ' ',
				},
				{
					selector: /(\p{L})\p{M}*/gu,
					replacer: (x) => x[1]!.normalize('NFD')[Symbol.iterator]().next().value!,
				},
			],
			matcher: /nguoi phang/g,
		})

		const result = matcher[Symbol.replace](input, '[$&]')
		assertEquals(result, '[người phẳng], [người  phẳng], [nguoi phang], [nguoi  phang], [người phẳng]')
	})
})

const OffsetMap = NormalizedMatcher['OffsetMap']

Deno.test(OffsetMap.name, () => {
	const offsetMap = new OffsetMap([[2, 3], [4, 2], [10, 5]])

	assertEquals(offsetMap.remapToOriginal(-999), -999)
	assertEquals(offsetMap.remapToOriginal(0), 0)
	assertEquals(offsetMap.remapToOriginal(1), 1)
	assertEquals(offsetMap.remapToOriginal(2), 5)
	assertEquals(offsetMap.remapToOriginal(3), 6)
	assertEquals(offsetMap.remapToOriginal(4), 9)
	assertEquals(offsetMap.remapToOriginal(5), 10)
	assertEquals(offsetMap.remapToOriginal(10), 20)
	assertEquals(offsetMap.remapToOriginal(999), 1009)
})
