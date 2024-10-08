/**
 * A contract fulfilled by both `RegExp`s and `Irregex`s. The `Irregex` class implements these properties and methods of
 * the `RegExp` interface in a way that aims for compatibility with `RegExp`.
 */
export type Matcher = Pick<
	RegExp,
	| 'exec'
	| 'test'
	| 'lastIndex'
	| 'global'
	| typeof Symbol.matchAll
	| typeof Symbol.match
	| typeof Symbol.replace
	| typeof Symbol.search
	| typeof Symbol.split
>

/**
 * An abstract class that implements the `Matcher` contract, making it compatible with most functions that expect a
 * `RegExp`.
 */
export abstract class Irregex<T = unknown> implements Matcher {
	/**
	 * At minimum, derived `Irregex` classes must implement the `getMatch` method. The `getMatch` method is stateful and
	 * relies on the `lastIndex` property.
	 *
	 * You can also use the `fromIter` helper, which caches iterable results for a given input string and handles
	 * reading of `lastIndex`.
	 *
	 * @param str The input string
	 * @returns A `RegExpExecArray` or `null`
	 */
	abstract getMatch(str: string): (RegExpExecArray & T) | null

	readonly flags = 'g'
	readonly global = true

	#lastIndex = 0
	get lastIndex(): number {
		return this.#lastIndex
	}
	set lastIndex(val: number) {
		this.#lastIndex = val
		for (const matcher of this.trackLastIndex ?? []) {
			matcher.lastIndex = val
		}
	}

	/**
	 * A list of matchers that should have their `lastIndex` property kept in sync with the parent `Irregex`'s
	 *  `lastIndex` property. Useful for keeping internally-used regexes (or other matchers) in sync.
	 */
	trackLastIndex?: Pick<Matcher, 'lastIndex'>[]

	exec(str: string): (RegExpExecArray & T) | null {
		const match = this.getMatch(str)
		this.lastIndex = match ? match.index + match[0].length : 0

		return match
	}

	#lastCached?: {
		input: string
		iterated: (RegExpExecArray & T)[]
		iterator: Iterator<RegExpExecArray & T>
	}
	/**
	 * Convenience method for converting an iterator function to a match getter suitable for use with `getMatch`.
	 * Caches iterable results for a given input string and handles reading of `lastIndex`.
	 *
	 * @param str The input string
	 * @param getter A function that returns an iterable of matches
	 * @returns A `RegExpExecArray` or `null`
	 */
	fromIter(str: string, getter: (this: this) => Iterable<RegExpExecArray & T>): (RegExpExecArray & T) | null {
		if (this.#lastCached?.input !== str) {
			const iterator = getter.call(this)[Symbol.iterator]()

			this.#lastCached = {
				input: str,
				iterated: [],
				iterator,
			}
		}

		for (const x of this.#lastCached.iterated) {
			if (x.index >= this.lastIndex) return x
		}
		while (true) {
			const next = this.#lastCached.iterator.next()
			if (next.done) return null
			const x = next.value
			this.#lastCached.iterated.push(x)
			if (x.index >= this.lastIndex) return x
		}
	}

	*[Symbol.matchAll](str: string): Generator<RegExpExecArray & T, undefined, undefined> {
		while (true) {
			const result = this.exec(str)
			if (result == null) break

			yield result

			this.lastIndex = result.index + result[0].length
		}
	}

	[Symbol.match](str: string): (string[] & { 0: string }) | null {
		const all = [...this[Symbol.matchAll](str)].map(([x]) => x)
		return all.length ? all as string[] & { 0: string } : null
	}

	#replaceValueToReplacer(replaceValue: string) {
		return (substring: string, ...args: unknown[]) => {
			// function replacer(match, p1, p2, /* ..., */ pN, offset, string, groups)
			const offsetIdx = args.findIndex((x) => typeof x === 'number')!
			const offset = args[offsetIdx] as number
			const partials = args.slice(0, offsetIdx) as string[]
			const fullStr = args[offsetIdx + 1] as string
			const groups = args[offsetIdx + 2] as Record<string, string> | undefined

			return replaceValue.replaceAll(
				/\$(?:([$&`'])|(\d{1,2})|<([^>]*)>)/g,
				(m, sym, d, ident) => {
					switch (sym) {
						// $$	Inserts a "$".
						case '$':
							return '$'
						// $&	Inserts the matched substring.
						case '&':
							return substring
						// $`	Inserts the portion of the string that precedes the matched substring.
						case '`':
							return fullStr.slice(0, offset)
						// $'	Inserts the portion of the string that follows the matched substring.
						case "'":
							return fullStr.slice(offset + substring.length)
						default: {
							if (d) {
								// $n	Inserts the nth (1-indexed) capturing group where n is a positive integer less than 100.
								return partials[Number(d) - 1] ?? m
							} else if (ident) {
								// $<Name>	Inserts the named capturing group where Name is the group name.
								return groups ? groups[ident] ?? '' : m
							}

							return ''
						}
					}
				},
			)
		}
	}

	// deno-lint-ignore no-explicit-any
	[Symbol.replace](str: string, replacer: string | ((substring: string, ...args: any[]) => string)): string {
		const out: string[] = []

		const replace = typeof replacer === 'string' ? this.#replaceValueToReplacer(replacer) : replacer

		const matches = [...this[Symbol.matchAll](str)]

		for (const [idx, match] of matches.entries()) {
			if (idx === 0) {
				out.push(str.slice(0, match.index))
			}

			// function replacer(match, p1, p2, /* …, */ pN, offset, string, groups)
			out.push(replace(match[0], ...match.slice(1), match.index, str, match.groups))

			out.push(str.slice(
				match[0].length + match.index,
				matches[idx + 1]?.index,
			))
		}

		return out.join('') || str
	}

	test(str: string): boolean {
		return this.exec(str) != null
	}

	[Symbol.search](str: string): number {
		for (const match of this[Symbol.matchAll](str)) {
			this.lastIndex = 0
			return match.index!
		}

		return -1
	}

	[Symbol.split](str: string, limit?: number): string[] {
		const out = ['']

		const matches = [...this[Symbol.matchAll](str)]

		for (const [idx, match] of matches.entries()) {
			for (const m of match.slice(1)) {
				out.push(m)
			}

			out.push(str.slice(
				match[0].length + match.index,
				matches[idx + 1]?.index,
			))
		}

		if (out.length === 1) out[0] = str

		// https://tc39.es/ecma262/multipage/text-processing.html#sec-string.prototype.split
		const lim = (typeof limit === 'undefined' ? -1 : limit) >>> 0
		return out.slice(0, lim)
	}
}

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
