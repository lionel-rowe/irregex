import { Irregex, type Matcher } from './irregex.ts'

/**
 * Combine multiple matchers (`RegExp`s, `Irregex`es) to iterate through them in sync.
 */
export class CombinedMatcher extends Irregex {
	childMatchers: Matcher[]

	constructor(childMatchers: Matcher[]) {
		super()
		for (const m of childMatchers) {
			if (!m.global) throw new TypeError('All child matchers must be global')
		}
		this.childMatchers = childMatchers
		this.trackLastIndex = this.childMatchers
	}

	getMatch(str: string): RegExpExecArray {
		const nexts = this.childMatchers.map((matcher) => matcher.exec(str)).filter((x) => x != null)

		nexts.sort((a, b) => a!.index - b!.index)

		return nexts[0]
	}
}
