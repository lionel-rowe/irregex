/**
 * A binary search that accounts for non-exact matches.
 *
 * @param haystack The array to search, which **MUST** be sorted in ascending order.
 * @param needle The value to search for.
 * @returns
 * - If `needle` is matched exactly, the index of `needle`
 * - If any element is larger than `needle`, the bitwise complement of its index
 * - Otherwise, the bitwise complement of `haystack.length`
 *
 * Logic is based on C#'s [`Array.BinarySearch`](https://learn.microsoft.com/en-us/dotnet/api/system.array.binarysearch#system-array-binarysearch(system-array-system-object)).
 */
export function binarySearch(haystack: readonly number[], needle: number): number {
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
