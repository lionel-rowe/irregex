import { assertEquals } from '@std/assert/equals'
import { Irregex } from '../src/irregex.ts'

export function assertAllEqual<T>(...args: [reference: T, actual1: T, actual2: T, ...actuals: T[]]) {
	const [reference, ...actuals] = args

	for (const actual of actuals) {
		assertEquals(actual, reference)
	}
}

/** A wrapper around RegExp that should behave exactly the same as its wrapped RegExp */
export class RegexWrapper extends Irregex {
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
