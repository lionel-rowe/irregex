import { Irregex } from '../irregex.ts'
import { convertReplacerFunction, type TypedReplacerFn } from '../replace.ts'

export type NormalizedMatcherProps = {
	normalizers: readonly NormalizerConfig[]
	matcher: RegExp
}

export type NormalizerConfig = {
	selector: RegExp
	replacer: TypedReplacerFn
}

type OffsetMapState = Readonly<{
	readonly brand: unique symbol
	cursor: number
	increment: number
}>

class OffsetMap {
	#cursor = 0
	#increment = 0

	#latestIncrement = 0
	get latestIncrement() {
		return this.#latestIncrement
	}

	readonly offsets: [number, number][]

	/** Map of `replacement-offset -> increment` (negative = decrement) */
	constructor(offsets: [number, number][]) {
		this.offsets = offsets
	}

	get state(): OffsetMapState {
		return {
			cursor: this.#cursor,
			increment: this.#increment,
		} as OffsetMapState
	}

	set state({ cursor, increment }: OffsetMapState) {
		this.#cursor = cursor
		this.#increment = increment
	}

	remapToOriginal(offset: number) {
		this.#latestIncrement = 0

		for (; this.#cursor < this.offsets.length; ++this.#cursor) {
			const offsetInfo = this.offsets[this.#cursor]!
			const [currentOffset, currentIncrement] = offsetInfo

			if (currentOffset > offset) break

			this.#latestIncrement = currentIncrement

			this.#increment += currentIncrement
		}

		return offset + this.#increment
	}
}

export class NormalizedMatcher extends Irregex {
	#matcher: RegExp
	#originalMatcherFlags: string

	#normalizers: readonly NormalizerConfig[]

	constructor({ matcher, normalizers }: NormalizedMatcherProps) {
		super()
		this.#normalizers = normalizers

		this.#matcher = new RegExp(matcher.source, [...new Set(matcher.flags + 'dg')].join(''))
		this.#originalMatcherFlags = matcher.flags

		this.trackLastIndex = [this.#matcher]
	}

	protected override getMatch(input: string): RegExpExecArray | null {
		return this.fromIter(input, function* () {
			let replacementIncrement = 0

			let offsetMap = new NormalizedMatcher.OffsetMap([])
			let inputNormalized = input

			for (const { selector, replacer } of this.#normalizers) {
				const offsets: [number, number][] = []

				let originalIncrement = 0

				inputNormalized = inputNormalized.replaceAll(
					selector,
					convertReplacerFunction((m) => {
						const replacement = replacer(m)
						const [{ length: originalLength }] = m
						const originalStart = offsetMap.remapToOriginal(m.index)

						const replacementStart = originalStart + replacementIncrement

						if (replacement.length !== originalLength) {
							const replacementEnd = replacementStart + replacement.length
							const originalEnd = originalStart + originalLength

							const originalEndIncrement = originalEnd - replacementEnd - originalIncrement
							offsets.push([replacementEnd, originalEndIncrement])
							replacementIncrement = replacementEnd - originalEnd
							originalIncrement += originalEndIncrement
						}

						return replacement
					}),
				)

				offsetMap = new NormalizedMatcher.OffsetMap([
					...offsetMap.offsets,
					...offsets,
				].sort(([a], [b]) => a - b))
			}

			// needs to be reset for each match group
			let state = offsetMap.state

			for (const match of inputNormalized.matchAll(this.#matcher)) {
				for (const [i, m] of match.entries()) {
					const indices = match.indices![i]!
					const [start] = indices
					const end = start + m.length

					if (i === 0) {
						state = offsetMap.state
					} else {
						offsetMap.state = state
					}

					const remappedStart = offsetMap.remapToOriginal(start)
					let remappedEnd = offsetMap.remapToOriginal(end)

					match[i] = input.slice(remappedStart, remappedEnd)

					/**
					 * TODO: Maybe reconsider this logic so no need to special-case whitespace...?
					 *
					 * I think (?) it has to be special-cased, otherwise no way of discriminating between e.g. stripped
					 * trailing whitespace (`"abc "` -> `"abc"`), which should be excluded from the match, vs stripped
					 * diacritics (`"abc\u0301"` -> `"abc"`), which should be included.
					 */
					if (offsetMap.latestIncrement > 0) {
						const maybeWs = match[i].match(/\s+$/)
						if (maybeWs) {
							const len = Math.min(maybeWs[0].length, offsetMap.latestIncrement)
							match[i] = match[i].slice(0, -len)
							remappedEnd -= len
						}
					}

					indices[0] = remappedStart
					indices[1] = remappedEnd

					if (i === 0) {
						match.index = remappedStart
						match.input = input
					}
				}

				for (const k of Object.keys(match.groups ?? {})) {
					// no need to remap, as `indices.groups` correspond to, are reference-equal to, numbered
					// `indices` entries
					match.groups![k] = input.slice(...match.indices!.groups![k]!)
				}

				if (!this.#originalMatcherFlags.includes('d')) {
					delete match.indices
				}

				yield match

				if (!this.#originalMatcherFlags.includes('g')) {
					break
				}
			}
		})
	}

	private static OffsetMap = OffsetMap
}
