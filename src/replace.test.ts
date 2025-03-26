import { assertEquals } from '@std/assert'
import { convertReplacerFunction } from './replace.ts'

Deno.test(convertReplacerFunction.name, () => {
	assertEquals(
		'Hello world'.replace(/\w+/g, convertReplacerFunction((m) => `${m.index}:${m[0]}`)),
		'0:Hello 6:world',
	)
	assertEquals(
		'Hello world'.replace(/(?<initial>\w)\w+/g, convertReplacerFunction((m) => m.groups!.initial!)),
		'H w',
	)
})
