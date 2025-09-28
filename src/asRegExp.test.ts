import { assertEquals, assertInstanceOf } from '@std/assert'
import { Irregex } from '../src/irregex.ts'

class Irre extends Irregex {
	re = /./g
	protected override trackLastIndex = [this.re]

	protected override getMatch(str: string) {
		return this.re.exec(str)
	}

	foo() {
		return 'foo' as const
	}
}

Deno.test(Irregex.prototype.asRegExp.name, async (t) => {
	const irre = new Irre()

	await t.step('type checking', () => {
		void (() => {
			// @ts-expect-error Type 'Irre' is missing properties from type 'RegExp'
			const _x: RegExp = irre
			// no error
			const _y: RegExp = irre.asRegExp()
		})
	})

	await t.step('instanceof', () => {
		assertInstanceOf(irre.asRegExp(), RegExp)
	})

	await t.step('string methods', () => {
		const x = irre.asRegExp()
		const str = 'abc'

		assertEquals([...str.matchAll(x)], [...x[Symbol.matchAll](str)])
		assertEquals(str.match(x), x[Symbol.match](str))
		assertEquals(str.search(x), x[Symbol.search](str))
		assertEquals(str.replace(x, '!'), x[Symbol.replace](str, '!'))
		assertEquals(str.split(x), [...x[Symbol.split](str)])
	})

	await t.step('still has access to own methods', () => {
		assertEquals(irre.asRegExp().foo(), 'foo')
		assertEquals(irre.asRegExp().foo(), irre.foo())
	})
})
