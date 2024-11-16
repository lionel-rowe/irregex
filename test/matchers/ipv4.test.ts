import { assertEquals } from '@std/assert/equals'
import { Ipv4Matcher } from '../../src/matchers/ipv4.ts'

Deno.test(Ipv4Matcher.name, async (t) => {
	await t.step('match', () => {
		const matcher = new Ipv4Matcher()
		const input = '192.168.1.1\n999.999.999.999\n255.255.255.255'
		const expected = ['192.168.1.1', '255.255.255.255']

		for (let i = 0; i < 2; ++i) {
			assertEquals(matcher[Symbol.match](input), expected)
		}
	})
})
