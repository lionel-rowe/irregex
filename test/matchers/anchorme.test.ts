import { assertEquals } from '@std/assert/equals'
import { AnchorMe } from '../../src/matchers/anchorme.ts'

Deno.test(AnchorMe.name, async (t) => {
	const input = `
		http://www.google.com
		wordpress.com/post.php?p=112
		not a link
		email@ex.com
		mailto:email@ex.com 
		file:///c:/directory/somefile.zip
	`

	await t.step('all reasons', () => {
		const actual = [...new AnchorMe()[Symbol.matchAll](input)].flat()
		assertEquals(actual, [
			'http://www.google.com',
			'wordpress.com/post.php?p=112',
			'email@ex.com',
			'mailto:email@ex.com',
			'file:///c:/directory/somefile.zip',
		])
	})

	for (
		const { reason, expect } of [
			{ reason: 'url' as const, expect: ['http://www.google.com', 'wordpress.com/post.php?p=112'] },
			{ reason: 'email' as const, expect: ['email@ex.com', 'mailto:email@ex.com'] },
			{ reason: 'file' as const, expect: ['file:///c:/directory/somefile.zip'] },
		]
	) {
		await t.step(reason, () => {
			const actual = [...new AnchorMe([reason])[Symbol.matchAll](input)].flat()
			assertEquals(actual, expect)
		})
	}
})
