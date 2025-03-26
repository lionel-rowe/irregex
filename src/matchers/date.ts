import 'https://esm.sh/v131/temporal-polyfill@0.1.1/dist/global.mjs'
import { Irregex } from '../irregex.ts'

export class DateMatcher extends Irregex {
	segmenter: Intl.Segmenter

	re = /^(?<YYYY>\d{4})(?<delim>[\-\/])(?<MM>\d{2})\k<delim>(?<DD>\d{2})$/
	segmentLen = ['YYYY', '-', 'MM', '-', 'DD'].length
	yearLen = 'YYYY'.length

	constructor() {
		super()
		this.segmenter = new Intl.Segmenter('en-US', { granularity: 'word' })
	}

	getMatch(str: string): RegExpExecArray | null {
		const { re, segmentLen, yearLen } = this

		return this.fromIter(str, function* () {
			const buf: string[] = []
			for (const segmentData of this.segmenter.segment(str)) {
				buf.push(segmentData.segment)

				if (buf.length > segmentLen) buf.shift()

				if (buf.length < segmentLen) continue
				if (buf[0]!.length !== yearLen) continue
				if (/\D/.test(buf[0]!)) continue

				const candidate = buf.join('')
				const m = re.exec(candidate)

				if (m) {
					try {
						new Temporal.PlainDate(Number(m.groups!.YYYY), Number(m.groups!.MM), Number(m.groups!.DD))

						yield Object.assign([candidate] as [string], {
							input: segmentData.input,
							index: segmentData.index,
							groups: m.groups,
						})
					} catch { /* no match */ }
				}
			}
		})
	}
}
