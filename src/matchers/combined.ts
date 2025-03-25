import { Irregex, type Matcher } from '../irregex.ts'

/**
 * Combine multiple matchers (`RegExp`s, `Irregex`es) to iterate through them in sync.
 */
export class CombinedMatcher extends Irregex {
	childMatchers: [Matcher, ...Matcher[]]

	constructor(childMatchers: Matcher[]) {
		super()
		if (!childMatchers.length) {
			throw new TypeError('Must supply at least one child matcher')
		}

		if (!childMatchers.every((x) => x.flags.includes('g'))) {
			throw new TypeError('All child matchers must be global')
		}
		this.childMatchers = childMatchers as [Matcher, ...Matcher[]]
		this.trackLastIndex = this.childMatchers
	}

	getMatch(str: string): RegExpExecArray | null {
		let next = this.childMatchers[0].exec(str)
		for (const matcher of this.childMatchers.slice(1)) {
			const result = matcher.exec(str)
			if (result == null) continue
			else if (next == null || result.index < next.index) next = result
		}

		return next
	}
}
