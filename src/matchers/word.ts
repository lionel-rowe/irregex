import { Irregex } from '../irregex.ts'

export class WordMatcher extends Irregex {
	segmenter: Intl.Segmenter

	constructor(locale: Intl.LocalesArgument) {
		super()
		this.segmenter = new Intl.Segmenter(locale, { granularity: 'word' })
	}

	protected override getMatch(str: string) {
		return this.fromIter(str, function* () {
			for (const segmentData of this.segmenter.segment(str)) {
				if (segmentData.isWordLike && /\p{L}/u.test(segmentData.segment)) {
					const arr: [string] = [segmentData.segment]

					yield Object.assign(arr, {
						...segmentData,
						groups: {
							abbr: segmentData.segment.match(/^.{0,3}/u)![0],
						},
					})
				}
			}
		})
	}
}
