/**
 * A contract fulfilled by both `RegExp`s and `Irregex`s. The `Irregex` class implements these properties and methods of
 * the `RegExp` interface in a way that aims for compatibility with `RegExp`.
 */
export type Matcher = Pick<
	RegExp,
	| 'exec'
	| 'test'
	| 'lastIndex'
	| 'flags'
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

	flags: string = 'g'

	#lastIndex = 0
	get lastIndex(): number {
		return this.#lastIndex
	}
	set lastIndex(val: number) {
		// coerce to positive int 0..2147483647
		val = Math.max(0, val | 0)

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
		using _ = this.#resetLastIndex(this.lastIndex)

		while (true) {
			const match = this.exec(str)
			if (match == null) return

			// prevent infinite loops on zero-length matches
			if (match[0] === '') {
				this.lastIndex = this.#advanceStringIndex(str, this.lastIndex)
			}

			yield match
		}
	}

	[Symbol.match](str: string): (string[] & { 0: string }) | null {
		using _ = this.#resetLastIndex(0)
		this.lastIndex = 0

		const all = [...this[Symbol.matchAll](str)].map(([x]) => x)
		return all.length ? all as string[] & { 0: string } : null
	}

	#replaceValueRe(flags: string) {
		return new RegExp(
			/\$(?:([$&`'])|(\d{1,2})|<([^>]*)>)/,
			flags,
		)
	}
	#replaceValueToReplacer(replaceValue: string) {
		// fast paths for common cases
		if (replaceValue === '') return () => ''
		if (!this.#replaceValueRe('').test(replaceValue)) return () => replaceValue

		return (substring: string, ...args: unknown[]) => {
			// function replacer(match, p1, p2, /* ..., */ pN, offset, string, groups)
			const offsetIdx = args.findIndex((x) => typeof x === 'number')!
			const offset = args[offsetIdx] as number
			const partials = args.slice(0, offsetIdx) as string[]
			const fullStr = args[offsetIdx + 1] as string
			const groups = args[offsetIdx + 2] as Record<string, string> | undefined

			return replaceValue.replaceAll(
				this.#replaceValueRe('g'),
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
		using _ = this.#resetLastIndex(0)
		this.lastIndex = 0

		const matches = [...this[Symbol.matchAll](str)]
		if (!matches.length) return str

		const out: string[] = []
		const replace = typeof replacer === 'string' ? this.#replaceValueToReplacer(replacer) : replacer

		out.push(str.slice(0, matches[0]?.index))

		for (const [idx, match] of matches.entries()) {
			// function replacer(match, p1, p2, /* …, */ pN, offset, string, groups)
			out.push(replace(match[0], ...match.slice(1), match.index, str, match.groups))

			out.push(str.slice(
				match.index + match[0].length,
				matches[idx + 1]?.index,
			))
		}

		return out.join('')
	}

	test(str: string): boolean {
		return this.exec(str) != null
	}

	[Symbol.search](str: string): number {
		using _ = this.#resetLastIndex(this.lastIndex)
		this.lastIndex = 0

		return this.exec(str)?.index ?? -1
	}

	#resetLastIndex(to: number) {
		return {
			[Symbol.dispose]: () => this.lastIndex = to,
		}
	}

	#advanceStringIndex(referenceStr: string, index: number) {
		if (index + 1 >= referenceStr.length) return index + 1
		const cp = referenceStr.codePointAt(index)!
		return index + (cp > 0xFFFF ? 2 : 1)
	}

	#execStickily(str: string): (RegExpExecArray & T) | null {
		const i = this.lastIndex
		let match = this.getMatch(str)
		if (match?.index !== i) match = null
		this.lastIndex = match ? match.index + match[0].length : 0
		return match
	}

	// https://tc39.es/ecma262/multipage/text-processing.html#sec-regexp.prototype-%symbol.split%
	[Symbol.split](str: string, limit?: number): string[] {
		using _ = this.#resetLastIndex(this.lastIndex)
		this.lastIndex = 0

		const out: string[] = []

		const lim = (typeof limit === 'undefined' ? -1 : limit) >>> 0
		if (lim === 0) return out

		if (str === '') {
			return this.#execStickily(str) == null ? [str] : []
		}

		let p = 0
		for (let q = p; q < str.length;) {
			this.lastIndex = q
			const z = this.#execStickily(str)
			if (z == null) {
				q = this.#advanceStringIndex(str, q)
			} else {
				const e = Math.min(this.lastIndex, str.length)
				if (e === p) {
					q = this.#advanceStringIndex(str, q)
				} else {
					for (const match of [str.slice(p, q), ...z.slice(1)]) {
						out.push(match)
						if (out.length === lim) return out
					}
					q = p = e
				}
			}
		}

		out.push(str.slice(p))
		return out
	}

	/**
	 * Returns a proxied `RegExp` that forwards all property/method lookups to this `Irregex` instance
	 * if they exist on it.
	 * @returns The proxied `RegExp`
	 */
	asRegExp(): this & RegExp {
		const bound = new Map<string | symbol, (...args: unknown[]) => unknown>()
		return new Proxy(new RegExp(''), {
			get: (regex, key, _receiver) => {
				if (key in this) {
					const val = Reflect.get(this, key)
					return typeof val === 'function' ? bound.set(key, bound.get(key) ?? val.bind(this)).get(key) : val
				}
				return Reflect.get(regex, key)
			},
			set: (_regex, key, val, _receiver) => Reflect.set(this, key, val),
		}) as this & RegExp
	}
}
