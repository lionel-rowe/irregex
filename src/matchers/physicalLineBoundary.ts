import { unicodeWidth } from '@std/cli/unicode-width'
import { Irregex } from '../irregex.ts'

export class PhysicalLineBoundaryMatcher extends Irregex {
	colWidth: number
	stringWidth = unicodeWidth

	constructor(colWidth: number) {
		super()
		this.colWidth = colWidth
	}

	protected override getMatch(str: string) {
		return this.fromIter(str, function* () {
			let prevLineBreak: RegExpExecArray | undefined
			let prevWordBreak: RegExpExecArray | undefined

			for (const m of str.matchAll(/\s+/g)) {
				const rest = str.slice(prevLineBreak?.index ?? 0, m.index)
				const line = rest.slice(rest.lastIndexOf('\n') + 1)

				if (this.stringWidth(line) > this.colWidth && prevWordBreak != null) {
					yield prevLineBreak = prevWordBreak
				}

				prevWordBreak = m
			}
		})
	}
}
