import shelljs from 'shelljs'
import Zip from 'node-zip'
import { createReadStream, createWriteStream, readFileSync, writeFileSync } from 'fs'

const { mkdir, exec, cp, cd, rm, ls } = shelljs

rm('-rf',  'dist')
mkdir('-p', 'dist')
exec('lerna run build')
cp('packages/cli/dist/gk6x-*', 'dist/')
cd('dist')

console.log('zipping dist/gk6x-linux.zip')
const zip1 = Zip()
zip1.file('gk6x', readFileSync('gk6x-linux'))
writeFileSync('gk6x-linux.zip', zip1.generate({base64:false, compression:'DEFLATE'}), 'binary')
rm('gk6x-linux')

console.log('zipping dist/gk6x-macos.zip')
const zip2 = Zip()
zip2.file('gk6x', readFileSync('gk6x-macos'))
writeFileSync('gk6x-macos.zip', zip2.generate({base64:false, compression:'DEFLATE'}), 'binary')
rm('gk6x-macos')

console.log('zipping dist/gk6x-win.zip')
const zip3 = Zip()
zip3.file('gk6x.exe', readFileSync('gk6x-win.exe'))
writeFileSync('gk6x-win.zip', zip3.generate({base64:false, compression:'DEFLATE'}), 'binary')
rm('gk6x-win.exe')


