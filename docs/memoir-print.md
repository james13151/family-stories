# Memoir print file and EPUB

`/book` is the family memoir. The title, subtitle, author or family name, dedication, preface, chapter grouping, chapter titles, chapter order, story order, and which stories are included are saved on the account. Individual stories are still edited on their own pages. A booklet of one story, or of a small set, is still a separate print.

The browser print button remains for reading on screen or saving a quick PDF. The file to hand to a printer is **Download print-ready PDF**. **Download EPUB** is the same book for an e-reader.

## What the PDF contains

The first page is a cover spread: back cover, spine, and front cover, plus 3 mm bleed. The pages after it are the interior: title page, dedication and preface when they were written, contents, a chapter opening, then each story and its photographs. Interior pages are padded to an even count. Page numbers start at 1 on the interior and are not printed on the cover.

Trim sizes:

| Choice | Trim | Page size including 3 mm bleed |
| --- | --- | --- |
| A5 (default) | 148 × 210 mm | 154 × 216 mm |
| 5.5 × 8.5 in | 139.7 × 215.9 mm | 145.7 × 221.9 mm |

Interior margins, measured inside the trim, are about 16 mm at the top, 18 mm at the bottom, 14 mm on the outer edge, and 20 mm on the binding edge. Crop marks sit in the bleed. Fonts are embedded: Liberation Serif for Latin, and a subset of Droid Sans Fallback for Chinese. JPEG and PNG photographs are embedded at the size they were uploaded. WebP and GIF are left out of the print file; save those pictures as JPEG if they should appear. The file does not enlarge a small photograph.

## Spine

Spine width is `page count × 0.05 mm`, rounded to 0.1 mm. The page count is the interior, not the cover. 0.05 mm is about the thickness of one side of an 80 gsm text sheet. A 160-page interior is about 8 mm. The figure is printed on the back cover. A spine of at least 8 mm also gets the book title turned along the spine. Thinner books leave the spine blank, because there is not enough room for type.

This is an estimate. A shop that uses different paper, or that counts a leaf differently, will remeasure. Tell them the assumption.

## What to tell the printer

1. The interior trim is A5, or 5.5 × 8.5 inches if that size was chosen. Bleed is 3 mm. Crop marks are on the file.
2. The first page is the cover spread (back, spine, front). Some shops want that page as its own file. Split the first page off in any PDF tool. Do not let them scale the interior to fit a different size.
3. The spine width on the back cover assumes 80 gsm text paper. Ask them to confirm the width for the paper they will use, and which cover template they print from (a local shop, or a print-on-demand hardcover template such as a 5.5 × 8.5 in case).
4. Photographs are the originals. A soft or small picture will print that way.

The site does not send the file to a print service.

## EPUB

The EPUB uses the saved structure: title, dedication, preface, chapters, stories, and JPEG or PNG photographs. The language follows the account (`en`, `zh-Hans`, or `zh-Hant`). Liberation Serif and the Chinese fallback font are embedded so Traditional and Simplified text can display when the reader uses the book's fonts. Some readers ignore embedded fonts and substitute their own. Those readers still receive the text and the chapter order.

## Deploying the table

The memoir is a `Memoir` row on the account. A server that is already running needs `npx prisma db push` (or the project's migrate step) so that table exists. Existing stories are not rewritten. Until a person saves the book, the memoir uses the previous defaults: their name, the usual title in the current language, chapters by time of life, and every story included.
