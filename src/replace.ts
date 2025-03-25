export type TypedReplacerFn = (params: RegExpExecArray) => string
export type NativeReplacerFn = (substring: string, ...args: unknown[]) => string

/**
 * Convert a typed replacer function, taking the more ergonomic and type-safe `RegExpExecArray` as its argument, into
 * an untyped one, which can be passed directly to `String#replace` or `String#replaceAll`.
 *
 * @example Index
 * ```ts
 * assertEquals(
 * 	'Hello world'.replace(/\w+/g, createReplacerFunction((m) => `${m.index}:${m[0]}`)),
 * 	'0:Hello 6:world',
 * )
 * ```
 * @example Named capture groups
 * ```ts
 * assertEquals(
 * 	'Hello world'.replace(/(?<initial>\w)\w+/g, createReplacerFunction((m) => m.groups!.initial)),
 * 	'H w',
 * )
 * ```
 */
export function convertReplacerFunction(fn: TypedReplacerFn): NativeReplacerFn {
	return (match: string, ...args: unknown[]) => {
		// arguments: `match, p1, p2, /* ..., */ pN, offset, string, groups`
		const offsetIdx = args.findIndex((x) => typeof x === 'number')
		const offset = args[offsetIdx] as number
		const partials = args.slice(0, offsetIdx) as string[]
		const input = args[offsetIdx + 1] as string
		const groups = args[offsetIdx + 2] as Record<string, string> | undefined

		const arr: [string, ...string[]] = [match, ...partials]
		return fn(Object.assign(arr, {
			index: offset,
			input,
			groups,
		}))
	}
}

export function replaceValueToReplacer(replaceValue: string): NativeReplacerFn {
	const replaceValueRe = /\$(?:([$&`'])|(\d{1,2})|<([^>]*)>)/g
	// fast paths for common cases
	if (replaceValue === '') return () => ''
	if (!replaceValueRe.test(replaceValue)) return () => replaceValue

	replaceValueRe.lastIndex = 0
	return convertReplacerFunction((x) =>
		replaceValue.replaceAll(replaceValueRe, (m: string, sym: string, d: string, ident: string) => {
			switch (sym) {
				// $$	Inserts a "$".
				case '$':
					return '$'
				// $&	Inserts the matched substring.
				case '&':
					return x[0]
				// $`	Inserts the portion of the string that precedes the matched substring.
				case '`':
					return x.input.slice(0, x.index)
				// $'	Inserts the portion of the string that follows the matched substring.
				case "'":
					return x.input.slice(x.index + x[0].length)
				default: {
					if (d) {
						// $n	Inserts the nth (1-indexed) capturing group where n is a positive integer less than 100.
						return x[Number(d)] ?? m
					} else if (ident) {
						// $<Name>	Inserts the named capturing group where Name is the group name.
						return x.groups ? x.groups[ident as string] ?? '' : m
					}

					return ''
				}
			}
		})
	)
}
