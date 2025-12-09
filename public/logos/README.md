# RPGCC Logo Files

Upload your logo files to this directory. The component will automatically detect and use them.

## Supported Logo Files

The component will look for logos in this order:

1. **For light backgrounds (dark logos):**
   - `/logos/rpgcc-logo-dark.png` (preferred)
   - `/logos/rpgcc-logo.png` (fallback)

2. **For dark backgrounds (light logos):**
   - `/logos/rpgcc-logo-light.png` (preferred)
   - `/logos/rpgcc-logo.png` (fallback)

## File Formats

- PNG (recommended for transparency)
- SVG (also supported)
- JPG/JPEG (if no transparency needed)

## Recommended Sizes

- **Small (sm):** 80x24px
- **Medium (md):** 120x32px  
- **Large (lg):** 180x48px
- **Extra Large (xl):** 240x64px

For best results, provide high-resolution versions (2x or 3x) and let Next.js Image optimization handle sizing.

## Usage

Once you upload your logo files, the `RPGCCLogo` component will automatically use them. If no image files are found, it will fall back to the text-based logo.

## Example File Names

- `rpgcc-logo-dark.png` - Dark logo for light backgrounds
- `rpgcc-logo-light.png` - Light logo for dark backgrounds
- `rpgcc-logo.png` - Generic logo (used as fallback)

