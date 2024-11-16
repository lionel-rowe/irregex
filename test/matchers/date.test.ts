import { assertEquals } from '@std/assert'
import { DateMatcher } from '../../src/matchers/date.ts'

Deno.test(DateMatcher.name, async (t) => {
	await t.step('OK, hyphens', () => {
		assertEquals(new DateMatcher().test('2001-01-01'), true)
	})
	await t.step('OK, slashes', () => {
		assertEquals(new DateMatcher().test('2002/02/02'), true)
	})

	await t.step('no match, mixed ', () => {
		assertEquals(new DateMatcher().test('2003-03/03'), false)
	})
	await t.step('no match, day segment too long', () => {
		assertEquals(new DateMatcher().test('2004-04-004'), false)
	})
	await t.step('no match, year segment too long', () => {
		assertEquals(new DateMatcher().test('20005-05-05'), false)
	})

	await t.step('doesn’t exist', () => {
		assertEquals(new DateMatcher().test('1999-99-99'), false)
	})

	await t.step('doesn’t exist, not a leapyear', () => {
		assertEquals(new DateMatcher().test('1999-02-29'), false)
	})
	await t.step('OK, leapyear', () => {
		assertEquals(new DateMatcher().test('2000-02-29'), true)
	})
})
