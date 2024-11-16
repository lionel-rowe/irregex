import { unicodeWidth } from '@std/cli/unicode-width'
import { Irregex } from '../irregex.ts'

export class PhysicalLineBoundaryMatcher extends Irregex {
	colWidth: number

	constructor(colWidth: number) {
		super()
		this.colWidth = colWidth
	}

	getMatch(str: string) {
		return this.fromIter(str, function* () {
			let prevLineBreak: RegExpExecArray | undefined
			let prevWordBreak: RegExpExecArray | undefined

			for (const m of str.matchAll(/\s+/g)) {
				const line = str.slice(prevLineBreak?.index ?? 0, m.index).split('\n').pop()!

				if (unicodeWidth(line) > this.colWidth) {
					if (prevWordBreak != null) yield prevWordBreak
					prevLineBreak = prevWordBreak
				}

				prevWordBreak = m
			}
		})
	}
}