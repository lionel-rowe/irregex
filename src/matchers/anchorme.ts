import { Irregex } from '../irregex.ts'
import anchorme from 'https://esm.sh/v135/anchorme@3.0.8'

function list(input: string): { start: number; end: number; string: string }[] {
	return anchorme.list(input, false)
}

const allReasons = ['url', 'file', 'email'] as const
type Reason = typeof allReasons[number]

export class AnchorMe extends Irregex<{ reason: Reason }> {
	constructor(public reasons: readonly Reason[] = allReasons) {
		super()
	}

	protected override getMatch(str: string) {
		return this.fromIter(str, function* () {
			for (const x of list(str)) {
				const { reason } = x as unknown as { reason: Reason }
				if (this.reasons.includes(reason)) {
					const groups = Object.fromEntries(
						Object.entries(x).filter(([k, v]) =>
							k !== 'reason' && typeof k === 'string' && typeof v === 'string'
						),
					) as Record<string, string>

					yield Object.assign(
						[x.string] as [string],
						{
							index: x.start,
							input: str,
							reason,
							groups,
						},
					)
				}
			}
		})
	}
}
