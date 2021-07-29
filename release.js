import shelljs from 'shelljs'
import { createGzip, createDeflate } from 'zlib'
import { createReadStream, createWriteStream } from 'fs'

const { mkdir, exec, cp, cd, rm, ls } = shelljs

rm('-rf',  'dist')
mkdir('-p', 'dist')
exec('lerna run build')
cp('packages/cli/dist/gk6x-*', 'dist/')

const fileContents1 = createReadStream('./dist/gk6x-linux')
const writeStream1 = createWriteStream('./dist/gk6x-linux.gz')
const zip1 = createGzip()
fileContents1.pipe(zip1).pipe(writeStream1).on('finish', () => {
  rm('./dist/gk6x-linux')
})

const fileContents2 = createReadStream('./dist/gk6x-macos')
const writeStream2 = createWriteStream('./dist/gk6x-macos.gz')
const zip2 = createGzip()
fileContents2.pipe(zip2).pipe(writeStream2).on('finish', () => {
  rm('./dist/gk6x-macos')
})


const fileContents3 = createReadStream('./dist/gk6x-win.exe')
const writeStream3 = createWriteStream('./dist/gk6x-win.gz')
const zip3 = createGzip()
fileContents3.pipe(zip3).pipe(writeStream3).on('finish', () => {
  rm('./dist/gk6x-win.exe')
})

