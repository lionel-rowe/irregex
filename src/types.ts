import { Irregex } from '../src/irregex.ts'

Deno.test('types', () => {
	void (() => {
		// @ts-expect-error Cannot create an instance of an abstract class.
		new Irregex()

		// @ts-expect-error Non-abstract class expression does not implement inherited abstract member 'getMatch' from class 'Irregex<unknown>'
		new (class extends Irregex {})()

		// ok
		const x = new (class X extends Irregex {
			protected override getMatch() {
				return this.fromIter('', () => [])
			}
		})()

		// ok
		x.exec('')

		// @ts-expect-error Property 'getMatch' is protected and only accessible within class 'X' and its subclasses.
		x.getMatch()
		// @ts-expect-error Property 'fromIter' is protected and only accessible within class 'X' and its subclasses.
		x.fromIter('', () => [])
	})
})
