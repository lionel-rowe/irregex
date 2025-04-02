# Irregex [![JSR](https://jsr.io/badges/@li/irregex)](https://jsr.io/@li/irregex)

Irregular expressions. Simplify implementation of classes that fulfil a regex-compatible contract.

## `Irregex` class

Abstract class for regex-compatible classes to inherit from.

At minimum, derived classes must implement the `getMatch` method, which is stateful and relies on the `lastIndex` property.

For convenience, you can also use the `fromIter` helper, which caches iterable results for a given input string and handles reading of `lastIndex`.

### Examples

Matching words in a string:

```ts
import { Irregex } from 'jsr:@li/irregex'

class WordMatcher extends Irregex {
    segmenter: Intl.Segmenter

    constructor(locale: string) {
        super()
        this.segmenter = new Intl.Segmenter(locale, { granularity: 'word' })
    }

    protected override getMatch(str: string) {
        return this.fromIter(str, function* () {
            for (const segmentData of this.segmenter.segment(str)) {
                if (segmentData.isWordLike && /\p{L}/u.test(segmentData.segment)) {
                    const arr: [string] = [segmentData.segment]

                    yield Object.assign(arr, {
                        ...segmentData,
                        groups: {
                            abbr: segmentData.segment.match(/^.{0,3}/u)![0],
                        },
                    })
                }
            }
        })
    }
}

new WordMatcher('en-US')[Symbol.replace](
    'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
    '($<abbr>)',
)
// "(Mon), (Tue), (Wed), (Thu), (Fri), (Sat), (Sun)"

new WordMatcher('zh-CN')[Symbol.match]('此地无银三百两')
// ["此地", "无", "银", "三百", "两"]
```

Matching IPv4 addresses:

```ts
class Ipv4Matcher extends Irregex {
    re = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/g

    constructor() {
        super()
        this.trackLastIndex = [this.re]
    }

    protected override getMatch(str: string) {
        while (true) {
            const m = this.re.exec(str)
            if (m == null) return null

            if (m.slice(1).every((x) => Number(x) < 256)) {
                return m
            }
        }
    }
}

new Ipv4Matcher()[Symbol.match]('192.168.1.1\n999.999.999.999\n255.255.255.255')
// ["192.168.1.1", "255.255.255.255"]
```

## `CombinedMatcher` class

Combine multiple matchers (`RegExp`s, `Irregex`es) to iterate through them in sync.

### Examples

Combining different types of matchers:

```ts
import { CombinedMatcher } from 'jsr:@li/irregex/matchers/combined'

const matcher = new CombinedMatcher([
    new WordMatcher('en-US'),
    new Ipv4Matcher(),
])

matcher[Symbol.match]('One two three 1 2 3 192.168.1.1 999.999.999.999 255.255.255.255 five!')
// ["One", "two", "three", "192.168.1.1", "255.255.255.255", "five"]
```

Combining case-sensitive and case-insensitive regexes:

```ts
import { CombinedMatcher } from 'jsr:@li/irregex/matchers/combined'

const matcher = new CombinedMatcher([
    /a/g,
    /b/gi,
])

matcher[Symbol.match]('a A b B')
// ["a", "b", "B"]
```
