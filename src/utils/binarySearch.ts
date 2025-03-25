/**
 * A non-exact binary search (unlike Deno `@std`'s current implementation, which just returns `null` if not found).
 *
 * Uses same logic as C#'s [`Array.BinarySearch`](https://learn.microsoft.com/en-us/dotnet/api/system.array.binarysearch#system-array-binarysearch(system-array-system-object)), which returns:
 * > The index of the specified value in the specified array, if value is found; otherwise, a negative number. If value is not found and value is less than one or more elements in array, the negative number returned is the bitwise complement of the index of the first element that is larger than value. If value is not found and value is greater than all elements in array, the negative number returned is the bitwise complement of (the index of the last element plus 1).
 *
 * @param haystack The array to search. This **MUST** already be sorted in ascending order.
 * @param needle The value to search for.
 */
export function binarySearch(haystack: number[], needle: number): number {
	return _binarySearch(haystack, needle, [0, haystack.length - 1])
}

function _binarySearch(haystack: number[], needle: number, [start, end]: [number, number]) {
	if (start > end) return ~start
	const mid = Math.floor((start + end) / 2)
	if (haystack[mid] === needle) return mid
	return _binarySearch(haystack, needle, haystack[mid] > needle ? [start, mid - 1] : [mid + 1, end])
}
