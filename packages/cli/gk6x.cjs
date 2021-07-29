#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const { readFile, writeFile } = require('fs').promises
const { extname, basename } = require('path')
const { devices, HID } = require('node-hid')
const chalk = require('chalk')

// stupid hack to make pkg work
const { Gk6xDevice, getInfoFromLEBuffer, CodeByKeys, ModifierByKeys } = require('./node_modules/@gk6x/core')

function convertLEtoPixeltris(buffer) {
  const info = getInfoFromLEBuffer(buffer)
  console.log(info)
  let out = `# pixeltris config-format for GK6X keyboards
# To see a list of the available keys see https://github.com/pixeltris/GK6X/blob/81761765f020962ed04ad68f8f0837facda7a1fa/GK6X/KeyValues.cs#L269
# Created on ${new Date(info.header.time * 1000)}
`
  if (info.header.typeName === 'LIGHT') {
    out += `
##################################################################
# Lighting
##################################################################
# TODO: seems like this format loads le files, it's not a format to convert them to
`
  }

  return out
}

function convertPixeltrisToLE(buffer) {
  const out = {}
  return out
}

function onData(data, name, keys) {
  console.log(chalk.yellow(name).padEnd(20, ' '), chalk.white(data.slice(0, 8).toString('hex').replace(/([0-9a-f]{2})/g, '$1 ').toUpperCase()), keys)
}

function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

function getKeysStandard(d) {
  const keys = []
  
  if (d[0] && ModifierByKeys[ d[0] ]) {
    keys.push(ModifierByKeys[ d[0] ])
  }

  if (d[2] && CodeByKeys[ d[2] ]){
    keys.push(CodeByKeys[ d[2] ])
  }

  return keys
}

function getKeysExtended(buffer) {
  const keys = []
  const b = [...buffer.slice(1, 8)]

  if (arrayEquals(b, [0x02, 0x00, 0x00, 0x00, 0x00, 0xA3, 0x11])){
    keys.push('KeyboardModeWindows')
  }

  if (arrayEquals(b, [0x01, 0x00, 0x00, 0x00, 0x00, 0xA7, 0x25])){
    keys.push('KeyboardModeOff')
  }

  if (arrayEquals(b, [0x03, 0x00, 0x00, 0x00, 0x00, 0x5F, 0x02])){
    keys.push('KeyboardModeMac')
  }

  if (arrayEquals(b, [0x04, 0x00, 0x00, 0x00, 0x00, 0xAB, 0x79])){
    keys.push('KeyboardMode3')
  }

  return keys
}

yargs(hideBin(process.argv))  
  .command('config <file>', 'Use le or pixeltris config format (easier to use) to setup your keyboard. It guesses format based on file-extension.', y => {}, async ({ file }) => {
    console.error('Not implemented yet. Check back, soon.')
  })
  
  .command('convert <file>', 'Convert to/from pixeltris and official le. It guesses format based on file-extension.', y => {}, async ({ file }) => {
    const ext = extname(file)
    const name = basename(file, ext)
    const source = await readFile(file)
    const isLE = (ext.toLowerCase() === '.le')
    if (isLE) {
      await writeFile(`${name}-pixeltris.txt`, convertLEtoPixeltris(source))
      console.log(`File saved in ${name}-pixeltris.txt`)
    } else {
      // pixeltris is several le files in one
      const out = convertLEtoPixeltris(source)
      await Promise.all(Object.keys(out).map(f => writeFile(`${name}-${f}.le`, out[f], 'binary')))
      console.log(`Files saved in ${Object.keys(out).map(f => `${name}-${f}.le`).join(', ')}`)
    }
  })
  
  .command('apple', "Force your keyboard to pretend it's an official apple keyboard.", y => {}, a => {
    try{
      const k = new Gk6xDevice()
      k.writeMacVid()
      k.close()
    } catch(e) {
      console.error("There was an issue opening a normal keyboard to put it in fake-apple mode. Maybe it's already in apple-mode? You might also need to run with sudo or something.")
      console.error(e.message)
    }
  })
  
  .command('normal', "Remove the weird apple setup.", y => {}, a => {
    try{
      Gk6xDevice.writeNormalVid()
    } catch(e) {
      console.error("There was an issue opening a fake apple keyboard to put it in normal mode. Maybe it's already in normal-mode? You might also need to run with sudo or something.")
      console.error(e.message)
    }
  })

  .command('show', 'Show incoming events', y => {}, async a => {
    // set to raw, so you can enter keys without printing them
    process.stdin.setRawMode(true)

    const k = new Gk6xDevice()
    const info = await k.modelInfo()
    console.log(`Listening on ${info.Name}`)
    k.onData = d => onData(d, 'Extended', getKeysExtended(d))
    await k.setKeyReport(true)
    
    process.on('exit', () => {
      process.stdin.setRawMode(false)
      k.setKeyReport(false)
      k.close()
    })

    // this captures regular key-events
    const k0 = devices().find(d => (d.vendorId === 0x1ea7 && d.productId === 0x907 && d.usagePage === 1))
    if (k0) {
      const k1 = new HID(k0.path)
      k1.on('data', d => {
        if (arrayEquals([...d], [0, 0, 0, 0, 0, 0, 0, 0])) {
          onData(d, 'Key Up', [])
        } else {
          const keys = getKeysStandard(d)
          onData(d, 'Standard', keys)
          if (arrayEquals(['LCtrl', 'C'], keys)){
            process.exit()
          }
        }
      })
    }
  })

  .example('$0 config mycoolfile.le', 'Load config from mycoolfile.le onto keyboard')
  .example('$0 config mycoolfile.txt', 'Load config from mycoolfile.txt onto keyboard')
  .example('$0 convert mycoolfile.le', 'Convert mycoolfile.le to pixeltris config format')
  .example('$0 convert mycoolfile.txt', 'Convert mycoolfile.txt to le format')
  .example('$0 apple', 'Make your keyboard appear to be an official apple keybaord')
  .example('$0 normal', 'Make your keyboard work right again (after running apple command)')
  .demandCommand(1)
  .argv
