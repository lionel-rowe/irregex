import { assertEquals } from '@std/assert'
import { binarySearch } from './binarySearch.ts'
import { assertSpyCalls, spy } from '@std/testing/mock'

Deno.test(binarySearch.name, async (t) => {
	await t.step('empty array', () => {
		assertEquals(binarySearch([], -1), -1)
		assertEquals(binarySearch([], 0), -1)
		assertEquals(binarySearch([], 1), -1)
	})

	await t.step('single element', () => {
		assertEquals(binarySearch([0], -1), -1)
		assertEquals(binarySearch([0], 0), 0)
		assertEquals(binarySearch([0], 1), -2)
	})

	await t.step('multiple elements', () => {
		const arr = [0, 10, 200, 3_000, 40_000, 500_000]

		const fn = () => {
			assertEquals(binarySearch(arr, -1), -1)
			assertEquals(binarySearch(arr, 0), 0)
			assertEquals(binarySearch(arr, 10), 1)
			assertEquals(binarySearch(arr, 200), 2)
			assertEquals(binarySearch(arr, 3_000), 3)
			assertEquals(binarySearch(arr, 40_000), 4)
			assertEquals(binarySearch(arr, 40_001), -6)
			assertEquals(binarySearch(arr, 500_000), 5)
			assertEquals(binarySearch(arr, 500_001), -7)
		}

		fn()

		assertEquals(binarySearch(arr, 6_000_000), -7)
		arr.push(6_000_000)
		assertEquals(binarySearch(arr, 6_000_000), 6)
		assertEquals(binarySearch(arr, 70_000_000), -8)

		fn()
	})

	await t.step('algorithm correctness - number of loop iterations', () => {
		/** `Math.trunc` calls act as a proxy for the number of loop iterations, as it's called once per iteration */
		const spyLoopIterations = () => spy(Math, 'trunc')

		const arr = Array.from({ length: 1_000_000 }, (_, i) => i)

		{
			using iterations = spyLoopIterations()
			const searchVal = 499_999
			const result = binarySearch(arr, searchVal)

			assertEquals(result, 499_999)
			assertSpyCalls(iterations, 1)
		}

		{
			using iterations = spyLoopIterations()
			const searchVal = 499_999.1
			const result = binarySearch(arr, searchVal)

			assertEquals(result, -500_001)
			assertSpyCalls(iterations, 19)
		}
	})
})
