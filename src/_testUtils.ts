import { assertEquals } from '@std/assert'
import { Irregex } from './irregex.ts'

export function assertAllEqual<T>(...args: [reference: T, actual1: T, actual2: T, ...actuals: T[]]) {
	const [reference, ...actuals] = args

	for (const actual of actuals) {
		assertEquals(actual, reference)
	}
}

/** A wrapper around RegExp that should behave exactly the same as its wrapped RegExp */
export class RegexWrapper extends Irregex {
	re: RegExp
	source: string

	constructor(pattern: RegExp | string, flags?: string) {
		super()
		this.re = new RegExp(pattern, flags)
		this.source = this.re.source
		this.flags = this.re.flags
		this.trackLastIndex = [this.re]
	}

	getMatch(str: string) {
		return this.re.exec(str)
	}
}
