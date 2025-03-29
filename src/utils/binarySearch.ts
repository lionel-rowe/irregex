/**
 * A binary search that accounts for non-exact matches.
 *
 * @param haystack - The array to search. This MUST be sorted in ascending order, otherwise results may be incorrect.
 * @param needle - The value to search for.
 * @param start - The starting index of the search range (inclusive). Default: `0`
 * @param end - The ending index of the search range (inclusive). Default: `haystack.length - 1`
 * @returns
 * - If `needle` is matched exactly, the index of `needle`. If multiple elements in `haystack` are equal to `needle`,
 *   the index of the first match found (which may not be the first sequentially) is returned.
 * - Otherwise, the [bitwise complement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_NOT)
 *   of `needle`'s insertion index if it were added to `haystack` in sorted order.
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
export function binarySearch<T extends ArrayLike<number> | ArrayLike<bigint>>(
	haystack: T,
	needle: T[number],
	start = 0,
	end = haystack.length - 1,
): number {
	let mid: number

	for (; start <= end; haystack[mid]! < needle ? start = mid + 1 : end = mid - 1) {
		mid = Math.trunc((start + end) / 2)
		if (haystack[mid] === needle) return mid
	}

	return ~start
}
