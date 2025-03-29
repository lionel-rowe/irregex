import { Irregex } from '../irregex.ts'
import { convertReplacerFunction, type TypedReplacerFn } from '../replace.ts'

type Props = {
	normalizers: readonly NormalizerConfig[]
	matcher: RegExp
}

type NormalizerConfig = {
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
		for (; this.#cursor < this.offsets.length; ++this.#cursor) {
			const offsetInfo = this.offsets[this.#cursor]!
			if (offsetInfo![0] > offset) break
			this.#increment += offsetInfo![1]
		}

		return offset + this.#increment
	}
}

export class NormalizedMatcher extends Irregex {
	#matcher: RegExp
	#originalMatcherFlags: string

	#normalizers: readonly NormalizerConfig[]

	constructor({ matcher, normalizers }: Props) {
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
					...new Map(offsetMap.offsets),
					...new Map(offsets),
				].sort(([a], [b]) => a - b))
			}

			// needs to be reset for each match group
			let state = offsetMap.state

			for (const match of inputNormalized.matchAll(this.#matcher)) {
				for (const [i, m] of match.entries()) {
					const indices = match.indices![i]!
					const [start] = indices

					if (i === 0) {
						state = offsetMap.state
					} else {
						offsetMap.state = state
					}

					const remappedStart = offsetMap.remapToOriginal(start)
					const remappedEnd = offsetMap.remapToOriginal(start + m.length)

					match[i] = input.slice(remappedStart, remappedEnd)

					indices[0] = remappedStart
					indices[1] = remappedEnd ?? 0

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
