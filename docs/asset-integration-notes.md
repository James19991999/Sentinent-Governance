# Asset Integration Notes

Every screen in the Stitch export (`docs/design-reference/*.png` + `DESIGN.md`)
was rebuilt as real React components using the exact color/type/spacing tokens
from `DESIGN.md`, encoded in `tailwind.config.ts`. No image assets from the
export are used directly as `<img>` sources — screenshots were used purely as
layout/visual references, and all icons were substituted with `lucide-react`
equivalents (open-source, no licensing concerns, matches the export's outline
icon style):

| Export concept | lucide-react icon |
|---|---|
| Shield (brand mark, sign-in) | `ShieldCheck` |
| Ethics tab | `ShieldCheck` |
| Bias tab / search glass | `Search` |
| Workflows tab | `Workflow` |
| Upskill tab (cap) | `GraduationCap` |
| Settings gear | `Settings` |
| Notification bell | `Bell` |
| Alert triangle | `AlertTriangle` |
| Play (run audit) | `Play` |

The export's course-catalog photography (AI Fundamentals, Prompt Engineering,
etc. cover images) was **not** reproduced — those were stock/generated images
in the export with no license info attached. `lib/data/courses.ts` ships real
course metadata (title, category, duration) without cover art; add licensed
imagery per course when available.
