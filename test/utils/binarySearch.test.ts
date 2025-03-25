import { assertEquals } from '@std/assert'
import { binarySearch } from '../../src/utils/binarySearch.ts'

Deno.test(binarySearch.name, () => {
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
