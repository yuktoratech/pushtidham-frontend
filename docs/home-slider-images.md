# Official homepage slideshow

The website displays the supplied Adhik Maas Shrinathji artwork first, followed by
the existing devotional hero and official Haveli exterior photograph. The supplied
1200 × 848 PNG was refined with image generation and adapted to a 1920 × 1356 WebP
for the slider, retaining the artwork's composition and aspect ratio. It is an
adapted version of the supplied image, not a higher-resolution original. The
first slide serves the 1920px R2 object at
`home-slider/adhik-maas-shrinathji/adhik-maas-shrinathji-hd.webp`, with a
960px mobile version at `home-slider/adhik-maas-shrinathji/adhik-maas-shrinathji-960.webp`.

Hero height is 470px on
desktop and 420px on mobile; welcome text and Donate Now / Learn More links
remain over the images. Rotation continues unless paused.

Previously, four photographs were sourced from the slider on
https://www.pushtidhamocala.org/index.asp, in the original order:

- `images/slider/pushtidham.jpg`: Haveli exterior.
- `images/slider/shreenathji1.jpg`: pink/gold devotional portrait.
- `images/slider/shreenathji2.jpg`: pearl-adorned devotional portrait.
- `images/slider/shreenathji3.jpg`: ceremonial dress.

All source files are 1400 × 600. The supplied images are upscaled with Lanczos3
and fitted inside 1920 × 1080 canvases, preserving the complete photograph and
its proportions. Dark green padding fills the remaining area. This is Full HD
output sizing, not newly recovered photographic detail or AI-redrawn artwork.
Mobile versions are 960 × 540. WebP quality is 92.

The eight uploaded files remain under the configured public R2 prefix
`home-slider/official-5ba55c13ca87a17e/`. Object names are
`{pushtidham,shreenathji1,shreenathji2,shreenathji3}-{1920,960}.webp`.
The complete upload is approximately 1.1 MB. Public downloads were verified
against the prepared files' SHA-256 checksums. Uploads used conditional creation;
no existing objects were overwritten or deleted. Credentials remain outside Git.

`lib/home-slides.ts` contains only public image URLs. Replace or extend that
manifest when an approved new image set is available. New bytes should use a new
prefix because the current objects have immutable one-year cache headers.

The slideshow advances every six seconds. Previous/next buttons, photo selectors,
keyboard arrows and touch swipes support manual navigation. Interaction pauses
rotation; a play button resumes it. Reduced-motion preferences disable automatic
rotation by default. Photographs fall back to existing local devotional artwork
on load failure. Welcome text and donation links remain over the photographs
as an overlay matching the approved reference. The new artwork, existing devotional
hero and Haveli exterior are selected by the current manifest; the other uploaded
objects are preserved without being displayed.
