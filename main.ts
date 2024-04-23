export type Matcher = Pick<
	RegExp,
	'exec'
	| typeof Symbol.matchAll
	| typeof Symbol.match
	| typeof Symbol.replace
	| typeof Symbol.search
	| typeof Symbol.split
	| 'lastIndex'
>

export abstract class Irregex implements Matcher {
	abstract exec(str: string): RegExpExecArray | null

	// abstract [Symbol.matchAll](str: string): IterableIterator<RegExpExecArray>
	
	*[Symbol.matchAll](str: string) {
		// let idx = 0

		while (true) {
			const result = this.exec(str)
			// console.log({ result })

			if (result == null) break
						
			// result.index += idx
			// result.input = str
			
			// if (result.indices) {
			// 	result.indices = result.indices.map(([start, end]) => [start + idx, end + idx])
			// }

			// console.log({ result })

			yield result

			this.lastIndex = result.index + result[0].length

			// idx = result.index + result[0].length
		}
	}

	flags = 'g'
	
	protected _lastIndex = 0
	get lastIndex() {
		return this._lastIndex
	}
	set lastIndex(val) {
		this._lastIndex = val
	}

	#replaceValueToReplacer(replaceValue: string) {
		// $$	Inserts a "$".
		// $&	Inserts the matched substring.
		// $`	Inserts the portion of the string that precedes the matched substring.
		// $'	Inserts the portion of the string that follows the matched substring.
		// $n	Inserts the nth (1-indexed) capturing group where n is a positive integer less than 100.
		// $<Name>	Inserts the named capturing group where Name is the group name.

		return (substring: string, ...args: unknown[]) => {
			// function replacer(match, p1, p2, /* …, */ pN, offset, string, groups)
			const indexIndex = args.findIndex((x) => typeof x === 'number')!
			const index = args[indexIndex] as number
			const partials = args.slice(0, indexIndex) as string[]
			const fullStr = args[indexIndex + 1] as string
			const groups = args[indexIndex + 2] as Record<string, string> | undefined

			return replaceValue.replaceAll(
				/\$(?:([$&`'])|(\d{1,2})|<([^>]*)>)/g,
				(m, sym, d, ident) => {
					switch (sym) {
						case '$':
							return '$'
						case '&':
							return substring
						case '`':
							return fullStr.slice(0, index)
						case "'":
							return fullStr.slice(index + substring.length)
						default: {
							if (d) {
								return partials[Number(d) - 1] ?? m
							} else if (ident) {
								return groups ? groups[ident] ?? '' : m
							}

							return ''
						}
					}
				},
			)
		}
	}

	[Symbol.match](str: string) {
		for (const match of this[Symbol.matchAll](str)) {
			return match
		}

		return null
	}

	[Symbol.replace](str: string, replacer: string | ((substring: string, ...args: unknown[]) => string)) {
		const out = ['']

		const replace = typeof replacer === 'string' ? this.#replaceValueToReplacer(replacer) : replacer

		const matches = [...this[Symbol.matchAll](str)]

		for (const [idx, match] of matches.entries()) {
			// function replacer(match, p1, p2, /* …, */ pN, offset, string, groups)
			out.push(replace(match[0], ...match.slice(1), match.index, str, match.groups))

			out.push(str.slice(
				match[0].length + match.index,
				matches[idx + 1]?.index,
			))
		}

		return out.join('') || str
	}

	[Symbol.search](str: string) {
		for (const match of this[Symbol.matchAll](str)) {
			return match.index!
		}

		return -1
	}

	[Symbol.split](str: string, limit?: number) {
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
		return out.slice(0, limit)
	}
}

const re = /(?<id>(a))(b)/g
// const str = 'xyz'
const str = 'ab!ab!ab'
const limit = undefined
const replacement = "[$1$2$`$'$<id>$<no>$&$$]"
// console.log([...re[Symbol.matchAll](str)])
// console.log([...re[Symbol.split](str, limit)])
console.log(11, re[Symbol.replace](str, replacement))

class X extends Irregex {
	re = new RegExp(re.source, re.flags)
	
	exec(str: string) {
		return this.re.exec(str)
	}

	// *[Symbol.matchAll](str: string) {
	// 	yield* re[Symbol.matchAll](str) as IterableIterator<RegExpExecArray>
	// }
}

const x = new X()

// console.log([...x[Symbol.matchAll](str)])
// console.log([...x[Symbol.split](str, limit)])
console.log(11, x[Symbol.replace](str, replacement))
console.log(x[Symbol.replace](str, replacement) === re[Symbol.replace](str, replacement))

class CombinedMatcher extends Irregex {
	childMatchers: Matcher[]

	constructor(childMatchers: Matcher[]) {
		super()
		this.childMatchers = childMatchers
	}
	
	set lastIndex(val: number) {
		this._lastIndex = val
		for (const matcher of this.childMatchers) {
			matcher.lastIndex = val
		}
	}

	exec(str: string): RegExpExecArray | null {
		const nexts = this.childMatchers.map((matcher) =>
			matcher.exec(str)
		).filter((x) => x != null)

		nexts.sort((a, b) => a!.index - b!.index)
		
		this.lastIndex = nexts[0]
			? nexts[0].index + nexts[0][0].length
			: 0

		return nexts[0]
	}
	
	// *[Symbol.matchAll](str: string) {
	// 	let idx = 0
	// 	let part = str
	// 	while (true) {
	// 		part = str.slice(idx)

	// 		const nexts: RegExpExecArray[] = this.childMatchers.map((matcher) =>
	// 			matcher[Symbol.matchAll](part).next().value
	// 		).filter(Boolean)

	// 		if (!nexts.length) break

	// 		nexts.sort((a, b) => a.index - b.index)

	// 		idx += nexts[0].index! + nexts[0][0].length
	// 		yield nexts[0]
	// 	}
	// }
}

const c = new CombinedMatcher([
	/a/g,
	/b/g,
])

console.log([...'abcabc'.matchAll(c as any as RegExp)].flat())
