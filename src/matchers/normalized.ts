import { Irregex } from '../irregex.ts'
import { convertReplacerFunction, type TypedReplacerFn } from '../replace.ts'
import { binarySearch } from '../utils/binarySearch.ts'

type Props = {
	normalize: RegExp
	normalizer: TypedReplacerFn
	matcher: RegExp
}

export class NormalizedMatcher extends Irregex {
	#matcher: RegExp
	#normalize: RegExp
	#normalizer: TypedReplacerFn
	#originalMatcherFlags: string

	constructor({ normalize, normalizer, matcher }: Props) {
		super()
		this.#normalize = normalize
		this.#normalizer = normalizer

		this.#matcher = new RegExp(matcher.source, [...new Set(matcher.flags + 'dg')].join(''))
		this.#originalMatcherFlags = matcher.flags

		this.trackLastIndex = [this.#matcher]
	}

	protected override getMatch(input: string): RegExpExecArray | null {
		return this.fromIter(input, function* () {
			const offsets: [number, number][] = []

			let replacementIndexIncrement = 0
			const inputNormalized = input.replaceAll(
				this.#normalize,
				convertReplacerFunction((x) => {
					const replacement = this.#normalizer(x)
					const [{ length: originalLength }] = x
					const { index: originalIndex } = x

					const replacementIndex = originalIndex + replacementIndexIncrement

					// offsets.push([replacementIndex, originalIndex])
					offsets.push([replacementIndex + replacement.length, originalIndex + originalLength])

					replacementIndexIncrement += replacement.length - originalLength

					return replacement
				}),
			)

			const offsetMap = new NormalizedMatcher.OffsetMap(offsets)

			for (const match of inputNormalized.matchAll(this.#matcher)) {
				for (const [i, m] of match.entries()) {
					const indices = match.indices![i]!
					const [start] = indices
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
					// no need to remap, as `indices.groups` correspond to, and refer to the same values as, numbered
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

	private static OffsetMap = class {
		#offsets: [number, number][] = []
		#replacementOffsets: number[] = []

		/** Map of `replacement-offset -> original-offset` */
		constructor(offsets: [number, number][]) {
			this.#offsets = offsets
			this.#replacementOffsets = offsets.map(([x]) => x)
		}

		remapToOriginal(offset: number) {
			const result = binarySearch(this.#replacementOffsets, offset)

			if (result === -1) return offset
			if (result < 0) {
				const prevIdx = ~result - 1
				return this.#offsets[prevIdx]![1] + (offset - this.#replacementOffsets[prevIdx])
			}

			return this.#offsets[result]![1]
		}
	}
}
