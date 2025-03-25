import { assertEquals, assertLessOrEqual } from '@std/assert'
import { PhysicalLineBoundaryMatcher } from './physicalLineBoundary.ts'
import { unicodeWidth } from '@std/cli/unicode-width'

Deno.test(PhysicalLineBoundaryMatcher.name, async (t) => {
	await t.step(Symbol.split.description!, () => {
		const matcher = new PhysicalLineBoundaryMatcher(80)
		function format(str: string) {
			return matcher[Symbol.split](str).join('\n')
		}

		assertEquals(format(lipsum), formatted)

		for (const line of format(lipsum).split('\n')) {
			assertLessOrEqual(unicodeWidth(line), 80)
		}
	})
})

const lipsum = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros odio, suscipit et sodales vitae, rutrum dignissim urna. Mauris non lectus tempus, placerat lectus ac, blandit erat. Fusce ultrices ornare nisl ut rutrum. Nam lobortis imperdiet nisl tincidunt convallis. Aenean ac mauris mattis, iaculis libero nec, vulputate diam. Donec nibh ligula, efficitur vel sodales laoreet, sollicitudin eu justo. Phasellus at est nibh. Maecenas vel tellus cursus, venenatis arcu id, mattis sem.

Cras eu dictum est. Fusce scelerisque nibh sed venenatis ultrices. Curabitur vehicula neque turpis, quis sagittis est ornare quis. Sed vitae tempor lorem. Phasellus non quam magna. Phasellus ultricies eros consequat justo malesuada, eget efficitur metus tincidunt. Vivamus efficitur fringilla diam, ut aliquet neque congue ac. Ut at enim justo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam sit amet augue semper, tempus felis eget, fringilla massa. Aliquam id finibus lacus. Proin aliquet sed leo eget imperdiet. Aenean quis enim a mauris hendrerit pulvinar. Pellentesque enim diam, dapibus quis euismod sit amet, scelerisque id nulla. Proin tempus fringilla feugiat.

Donec mattis, neque non bibendum interdum, felis sem pharetra quam, sit amet pharetra velit diam non lectus. Phasellus consequat, mi vel pretium venenatis, sem arcu pharetra eros, a consequat ligula neque eget ligula. Vestibulum et purus quis nulla volutpat scelerisque. Mauris ultricies ipsum nec urna tempor, sed commodo leo aliquet. Sed ac iaculis ante. Quisque fringilla finibus velit, et tempus eros mattis quis. Nunc eu quam eget mauris condimentum interdum non in dui. Vestibulum sed molestie lectus, non pretium turpis. Vivamus eu neque elit. Maecenas libero metus, vehicula ac tellus sed, consequat pellentesque eros. Aenean vel velit consequat, vehicula purus sit amet, posuere augue. Quisque elit lorem, convallis sed tincidunt a, interdum nec mi. Sed a lorem vel magna efficitur congue sed sed eros. Nulla facilisi. Ut vestibulum libero a sem varius viverra. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.

Pellentesque enim orci, commodo vel arcu ornare, porttitor lobortis dolor. Donec tortor massa, varius sit amet semper ut, aliquet ac ligula. Suspendisse non libero non velit iaculis pretium a et sapien. Suspendisse gravida leo quis turpis mollis ullamcorper et a purus. Duis tincidunt tellus sollicitudin lorem tempus, ac imperdiet nunc malesuada. Etiam sodales sapien in auctor efficitur. Proin eget justo sit amet nulla lobortis sagittis quis et augue. Etiam ultricies commodo venenatis. Nullam in tempor tellus. Ut eget turpis sed justo gravida consectetur. Vivamus in iaculis lorem. Vestibulum ac turpis id odio aliquet dictum eu ac quam.

Integer malesuada scelerisque rhoncus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Morbi non commodo sem. Vestibulum sed porttitor nibh, vel hendrerit nulla. Proin non lectus eu ipsum sollicitudin volutpat id quis lectus. Mauris scelerisque pulvinar velit non aliquet. Nullam quis porta mi. Fusce tempor purus a porttitor gravida. Cras ut elit lectus. Nunc a vulputate libero. Aenean volutpat dolor eget urna ornare convallis. Ut rhoncus faucibus diam sed convallis.`
	.trim()

const formatted = `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eros odio, suscipit
et sodales vitae, rutrum dignissim urna. Mauris non lectus tempus, placerat
lectus ac, blandit erat. Fusce ultrices ornare nisl ut rutrum. Nam lobortis
imperdiet nisl tincidunt convallis. Aenean ac mauris mattis, iaculis libero
nec, vulputate diam. Donec nibh ligula, efficitur vel sodales laoreet,
sollicitudin eu justo. Phasellus at est nibh. Maecenas vel tellus cursus,
venenatis arcu id, mattis sem.

Cras eu dictum est. Fusce scelerisque nibh sed venenatis ultrices. Curabitur
vehicula neque turpis, quis sagittis est ornare quis. Sed vitae tempor lorem.
Phasellus non quam magna. Phasellus ultricies eros consequat justo malesuada,
eget efficitur metus tincidunt. Vivamus efficitur fringilla diam, ut aliquet
neque congue ac. Ut at enim justo. Vestibulum ante ipsum primis in faucibus
orci luctus et ultrices posuere cubilia curae; Aliquam sit amet augue semper,
tempus felis eget, fringilla massa. Aliquam id finibus lacus. Proin aliquet sed
leo eget imperdiet. Aenean quis enim a mauris hendrerit pulvinar. Pellentesque
enim diam, dapibus quis euismod sit amet, scelerisque id nulla. Proin tempus
fringilla feugiat.

Donec mattis, neque non bibendum interdum, felis sem pharetra quam, sit amet
pharetra velit diam non lectus. Phasellus consequat, mi vel pretium venenatis,
sem arcu pharetra eros, a consequat ligula neque eget ligula. Vestibulum et
purus quis nulla volutpat scelerisque. Mauris ultricies ipsum nec urna tempor,
sed commodo leo aliquet. Sed ac iaculis ante. Quisque fringilla finibus velit,
et tempus eros mattis quis. Nunc eu quam eget mauris condimentum interdum non
in dui. Vestibulum sed molestie lectus, non pretium turpis. Vivamus eu neque
elit. Maecenas libero metus, vehicula ac tellus sed, consequat pellentesque
eros. Aenean vel velit consequat, vehicula purus sit amet, posuere augue.
Quisque elit lorem, convallis sed tincidunt a, interdum nec mi. Sed a lorem vel
magna efficitur congue sed sed eros. Nulla facilisi. Ut vestibulum libero a sem
varius viverra. Pellentesque habitant morbi tristique senectus et netus et
malesuada fames ac turpis egestas.

Pellentesque enim orci, commodo vel arcu ornare, porttitor lobortis dolor. Donec
tortor massa, varius sit amet semper ut, aliquet ac ligula. Suspendisse non
libero non velit iaculis pretium a et sapien. Suspendisse gravida leo quis
turpis mollis ullamcorper et a purus. Duis tincidunt tellus sollicitudin lorem
tempus, ac imperdiet nunc malesuada. Etiam sodales sapien in auctor efficitur.
Proin eget justo sit amet nulla lobortis sagittis quis et augue. Etiam
ultricies commodo venenatis. Nullam in tempor tellus. Ut eget turpis sed justo
gravida consectetur. Vivamus in iaculis lorem. Vestibulum ac turpis id odio
aliquet dictum eu ac quam.

Integer malesuada scelerisque rhoncus. Class aptent taciti sociosqu ad litora
torquent per conubia nostra, per inceptos himenaeos. Morbi non commodo sem.
Vestibulum sed porttitor nibh, vel hendrerit nulla. Proin non lectus eu ipsum
sollicitudin volutpat id quis lectus. Mauris scelerisque pulvinar velit non
aliquet. Nullam quis porta mi. Fusce tempor purus a porttitor gravida. Cras ut
elit lectus. Nunc a vulputate libero. Aenean volutpat dolor eget urna ornare
convallis. Ut rhoncus faucibus diam sed convallis.`.trim()
