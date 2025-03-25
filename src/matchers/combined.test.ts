import { assertEquals } from '@std/assert/equals'
import { Irregex } from '../irregex.ts'
import { AnchorMe } from './anchorme.ts'
import { Ipv4Matcher } from './ipv4.ts'
import { CombinedMatcher } from './combined.ts'

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
