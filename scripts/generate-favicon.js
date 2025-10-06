const fs = require('fs')
const path = require('path')
const _pngToIco = require('png-to-ico')
// The package may export the function as the default property depending on Node / bundler.
const pngToIco = _pngToIco && _pngToIco.default ? _pngToIco.default : _pngToIco

const src = path.join(__dirname, '..', 'public', 'images', 'favicon.png')
const dest = path.join(__dirname, '..', 'public', 'favicon.ico')

async function run() {
  try {
    if (!fs.existsSync(src)) {
      console.error('Source PNG not found:', src)
      process.exit(1)
    }

  // png-to-ico expects an array of input PNG paths
  const buf = await pngToIco([src])
    fs.writeFileSync(dest, buf)
    console.log('favicon.ico generated at', dest)
  } catch (err) {
    console.error('Error generating favicon:', err)
    process.exit(1)
  }
}

run()
