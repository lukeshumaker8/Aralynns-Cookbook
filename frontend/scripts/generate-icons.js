// Script to generate PWA icons
// Run with: node scripts/generate-icons.js
// Requires: npm install canvas

const fs = require('fs')
const path = require('path')

async function generateIcons() {
  try {
    const { createCanvas } = require('canvas')

    const sizes = [192, 512]
    const outputDir = path.join(__dirname, '../public/icons')

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    for (const size of sizes) {
      const canvas = createCanvas(size, size)
      const ctx = canvas.getContext('2d')

      // Background with rounded corners effect (we'll use a solid square)
      ctx.fillStyle = '#e85d04'
      ctx.fillRect(0, 0, size, size)

      // Draw emoji
      ctx.font = `${size * 0.55}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🍳', size / 2, size / 2)

      // Save as PNG
      const buffer = canvas.toBuffer('image/png')
      const outputPath = path.join(outputDir, `icon-${size}.png`)
      fs.writeFileSync(outputPath, buffer)
      console.log(`Generated: ${outputPath}`)
    }

    console.log('Icons generated successfully!')
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\nTo generate PNG icons, install canvas:')
      console.log('  npm install canvas --save-dev')
      console.log('\nThen run this script again.')
      console.log('\nAlternatively, create icons manually:')
      console.log('  - 192x192 PNG at public/icons/icon-192.png')
      console.log('  - 512x512 PNG at public/icons/icon-512.png')
      console.log('\nYou can use https://realfavicongenerator.net/ to generate icons')
    } else {
      throw error
    }
  }
}

generateIcons()
