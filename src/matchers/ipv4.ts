import { Irregex } from '../irregex.ts'

export class Ipv4Matcher extends Irregex {
	re = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/g

	constructor() {
		super()
		this.trackLastIndex = [this.re]
	}

	protected override getMatch(str: string): RegExpExecArray | null {
		while (true) {
			const m = this.re.exec(str)
			if (m == null) return null

			if (m.slice(1).every((x) => Number(x) < 256)) {
				return m
			}
		}
	}
}
