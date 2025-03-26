/**
 * A binary search that accounts for non-exact matches.
 *
 * @param haystack - The array to search, which **MUST** be sorted in ascending order.
 * @param needle - The value to search for.
 * @returns
 * - If `needle` is matched exactly, the index of `needle`
 * - Otherwise, the [bitwise complement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_NOT) of `needle`'s insertion index if it were added to `haystack` in sorted order.
 *
 * Return value semantics are the same as C#'s [`Array.BinarySearch`](https://learn.microsoft.com/en-us/dotnet/api/system.array.binarysearch#system-array-binarysearch(system-array-system-object))
 * and Java's [`Arrays.binarySearch`](https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html#binarySearch-int:A-int-).
 *
 * @example Usage
 * ```ts
 * assertEquals(binarySearch([0, 1], 0), 0)
 * assertEquals(binarySearch([0, 1], 1), 1)
 * assertEquals(binarySearch([0, 1], -0.5), -1) // (bitwise complement of 0)
 * assertEquals(binarySearch([0, 1], 0.5), -2) // (bitwise complement of 1)
 * assertEquals(binarySearch([0, 1], 1.5), -3) // (bitwise complement of 2)
 * ```
 */
export function binarySearch<T extends ArrayLike<number> | ArrayLike<bigint>>(haystack: T, needle: T[number]): number {
	let start: number, end: number, mid: number

	for (
		start = 0, end = haystack.length - 1;
		start <= end;
		haystack[mid]! < needle ? start = mid + 1 : end = mid - 1
	) {
		mid = Math.trunc((start + end) / 2)
		if (haystack[mid] === needle) return mid
	}

	return ~start
}
