import { devices, HID } from 'node-hid'
import crc16ccitt from './crc16_ccitt.js'

export class Gk6xDevice {
  static list () {
    return devices().filter(d => (d.vendorId === 0x1ea7 && d.productId === 0x907))
  }

  // fix keyboard if you ran writeMacVid()
  static writeNormalVid () {
    // has apple info, but also reports it's manufacturer-name as SEMITEK
    const screwedUpKeyboard = devices().find(d => d.manufacturer === 'SEMITEK' && d.vendorId === 1452 && d.productId === 591 && d.usagePage === 65280)

    if (!screwedUpKeyboard) {
      throw new Error('Apple keyboard with bad manufacturer not found!')
    }

    const device = new HID(screwedUpKeyboard.path)
    const buffer = Buffer.alloc(64)
    buffer.fill(0)
    buffer.writeUInt8(0x41, 0)
    buffer.writeUInt16LE(crc16ccitt(buffer), 6)
    device.write(buffer)
  }

  constructor () {
    const keyboards = Gk6xDevice.list()

    // on mine, there were many /dev/hidraw* but only usagePage=0xff00 works
    const dev = keyboards.find(k => k.usagePage === 0xff00)

    if (keyboards.length === 0 || !dev) {
      throw new Error('No keyboard found.')
    }

    this.serialNumber = dev.serialNumber
    this.manufacturer = dev.manufacturer
    this.product = dev.product
    this.release = dev.release
    this.device = new HID(dev.path)

    this.device.on('error', error => {
      console.error('ERROR', error)
    })

    // key responses by command, so they can be returned
    this.responses = {}
    this.device.on('data', data => {
      this.responses[data[0]] = data
    })
  }

  // cleanup handle & intervals
  close () {
    this.device.close()
  }

  // fire a command to keyboard
  // promise resolves on answer or errors on timeout
  cmd (cmd, sub_cmd = 0, header = 0, body, timeout = 1000) {
    const buffer = Buffer.alloc(64)
    buffer.writeUInt8(cmd, 0)
    buffer.writeUInt8(sub_cmd, 1)
    buffer.writeUInt32LE(header, 2)
    if (body) {
      body.copy(buffer, 8, 0, body.length)
    }
    buffer.writeUInt16LE(crc16ccitt(buffer), 6)
    delete this.responses[cmd]
    this.device.write(buffer)

    if (timeout) {
      return new Promise((resolve, reject) => {
        let time = 0
        const i = setInterval(() => {
          time += 1
          if (time >= timeout) {
            clearInterval(i)
            return reject(new Error('Timeout'))
          }
          if (this.responses[cmd]) {
            clearInterval(i)
            return resolve(this.responses[cmd])
          }
        }, 1)
      })
    }
  }

  // BE CAREFUL!!!
  // permanaently makes it look like a mac keyboard to OS
  // which makes it basically not work with this lib!
  // 05ac:024f Apple, Inc. Aluminium Keyboard (ANSI)
  // use Gk6xDevice.writeNormalVid() to fix it
  // I broke my keyboard in testing, and had to guess how to fix it
  writeMacVid () {
    return this.cmd(0x41, 0x01)
  }

  // set keyboard mode
  changeMode (mode) {
    return this.cmd(0x0b, mode).then(buffer => buffer.readUInt8(1))
  }

  // check if the device is available
  ping () {
    return this.cmd(0x0c, 0, 0, 0, 5000)
  }

  // get firmware version from keyboard
  version () {
    return this.cmd(0x01, 0x01).then(buffer => ({
      id: buffer.readUInt32LE(8),
      version: buffer.readUInt16LE(12)
    }))
  }

  // get device-id from keyboard
  deviceId () {
    return this.cmd(0x01, 0x02).then(buffer => {
      let deviceId = 0n
      for (let i = 0; i < 6; i++) deviceId |= BigInt(buffer[8 + i]) << BigInt(i * 8)
      return BigInt.asUintN(64, deviceId).toString(10)
    })
  }

  // get model-id from keyboard
  modelId () {
    return this.cmd(0x01, 0x08).then(buffer => buffer.readUInt32LE(8))
  }

  // get key-matrix from keyboard
  matrix () {
    return this.cmd(0x01, 0x09).then(buffer => ({
      col: buffer.readUInt8(8),
      row: buffer.readUInt8(9)
    }))
  }

  cleanData (mode, dataType) {
    return this.cmd(0x21, mode, dataType).then(buffer => ({ ack: buffer.readUInt8(1), buffer }))
  }

  writeKeyData (mode, addr, data) {
    const header = (data.length << 16) + addr
    return this.cmd(0x22, mode, header, data)
      .then(buffer => ({ ack: buffer.readUInt8(1), crc: buffer.readUInt16LE(6) }))
  }

  // TODO: what is 0x23?

  writeModeLE (mode, addr, data) {
    const header = (data.length << 16) + addr
    return this.cmd(0x24, mode, header, data)
      .then(buffer => ({ ack: buffer.readUInt8(1), crc: buffer.readUInt16LE(6) }))
  }

  writeMacro (mode, addr, data) {
    const header = (data.length << 16) + addr
    return this.cmd(0x25, mode, header, data)
      .then(buffer => ({ ack: buffer.readUInt8(1), crc: buffer.readUInt16LE(6) }))
  }

  writeLightKey (mode, addr, data) {
    const header = (data.length << 16) + addr
    return this.cmd(0x26, mode, header, data)
      .then(buffer => ({ ack: buffer.readUInt8(1), crc: buffer.readUInt16LE(6) }))
  }

  writeLightData (mode, addr, data) {
    const header = (data.length << 16) + addr
    return this.cmd(0x27, mode, header, data)
      .then(buffer => ({ ack: buffer.readUInt8(1), crc: buffer.readUInt16LE(6) }))
  }

  // TODO: what is 0x28?
  // TODO: what is 0x29?
  // TODO: what is 0x30?

  writeFnData (mode, addr, data) {
    const header = (data.length << 16) + addr
    return this.cmd(0x31, mode, header, data)
      .then(buffer => ({ ack: buffer.readUInt8(1), crc: buffer.readUInt16LE(6) }))
  }

  // tell keyboard to report keys or not
  setKeyReport (enabled) {
    return this.cmd(0x15, 0x03, 0, Buffer.from([enabled ? 0x01 : 0x00]))
      .then(buffer => buffer.readUInt8(2) === 1)
  }

  keyEvent (data) {
    return this.cmd(0x15, 0x02, 0, Buffer.from(data))
  }

  mouseEvent (mouse) {
    return this.cmd(0x15, 0x01, 0, Buffer.from([mouse]))
  }

  setKeyTable (byTableTyte, wAddr, BbyData) {
    const header = wAddr + ((BbyData.length << 24) & 0xff000000)
    return this.cmd(0x16, byTableTyte, header, BbyData)
      .then(buffer => buffer.readUInt8(1) === 1)
  }

  setLEConfig (byLEModel, byLESubModel, byLELight, byLESpeed, byLEDir, byR, byG, byB, bEnable) {
    const body = Buffer.alloc(9)
    body.writeUInt8(byLEModel, 0)
    body.writeUInt8(byLESubModel, 1)
    body.writeUInt8(byLELight, 2)
    body.writeUInt8(byLESpeed, 3)
    body.writeUInt8(byLEDir, 4)
    body.writeUInt8(byR, 5)
    body.writeUInt8(byG, 6)
    body.writeUInt8(byB, 7)
    body.writeUInt8(bEnable * 1, 8)
    return this.cmd(0x17, 0x01, 0, body)
      .then(buffer => buffer.readUInt8(1) === 1)
  }

  setLEDefine (wAddr, BbyData) {
    const header = wAddr + ((BbyData.length << 24) & 0xff000000)
    return this.cmd(0x1a, 0x01, header, BbyData)
      .then(buffer => buffer.readUInt8(1) === 1)
  }

  saveLEDefine () {
    return this.cmd(0x1a, 0x02)
      .then(buffer => buffer.readUInt8(1) === 1)
  }
}

const LETypes = ['_', 'PROFILE', 'LIGHT', 'STATASTIC', 'APPCONF', 'MACRO']

// did it come from the correct place? Bad way to check, but ok
const magicNumber = 0x434D4631

function getInitCRC (type, name) {
  const nameBuffer = Buffer.alloc(8)
  nameBuffer.write(name, 0, 'latin1')
  return crc16ccitt(crc16ccitt(Buffer.from(LETypes[type])), nameBuffer)
}

function decodeBodyBuffer ({ typeId, typeName }, pData) {
  let gnCRC = getInitCRC(typeId, typeName)
  let gnDataCRC = 0xFFFF
  let nLen = pData.length
  let index = 0
  while (nLen > 0) {
    pData[index] = pData[index] ^ (gnCRC & 0xFF)
    gnCRC = crc16ccitt(gnCRC, pData.slice(index, index + 1))
    gnDataCRC = crc16ccitt(gnDataCRC, pData.slice(index, index + 1))
    index++
    nLen--
  }
  return pData
}

function headerBufferToObject (h) {
  return {
    magic: h.readUInt32LE(0),
    hcrc: h.readUInt32LE(4),
    time: h.readUInt32LE(8),
    size: h.readUInt32LE(12),
    dcrc: h.readUInt32LE(16),
    typeId: h.readUInt8(20),
    typeName: h.slice(24).toString('latin1').split('\x00')[0]
  }
}

function headerObjectToBuffer (i) {
  if (!i.typeId && !i.typeName) {
    i.typeName = 'LIGHT'
  }
  if (i.typeName && !i.typeId) {
    i.typeId = LETypes.indexOf(i.typeName)
  }
  if (!i.typeName && i.typeId) {
    i.typeName = LETypes[i.typeId]
  }
  const buffer = Buffer.alloc(32)
  buffer.writeUInt32LE(i.magic || magicNumber, 0)
  buffer.writeUInt32LE(i.hcrc || 0, 4)
  buffer.writeUInt32LE(i.time || Math.round(Date.now() / 1000), 8)
  buffer.writeUInt32LE(i.size || 0, 12)
  buffer.writeUInt32LE(i.dcrc || 0, 16)
  buffer.writeUInt8(i.typeId, 20)
  buffer.write(i.typeName, 24, 8, 'latin1')
  return buffer
}

// this will turn an LE file/device buffer into an object
export function getInfoFromLEBuffer (buffer) {
  const encodedBody = buffer.slice(32)
  const header = headerBufferToObject(buffer.slice(0, 32))

  // check things
  if (header.magic !== magicNumber) {
    throw new Error('Invalid magic-number')
  }

  if (header.size !== encodedBody.length) {
    throw new Error('Data size mismatch')
  }

  const hcrc = crc16ccitt(headerObjectToBuffer({ ...header, hcrc: 0 }))
  if (hcrc !== header.hcrc) {
    throw new Error('Header CRC mismatch')
  }

  const body = decodeBodyBuffer(header, encodedBody)

  if (header.dcrc !== crc16ccitt(body)) {
    throw new Error('Data CRC mismatch')
  }

  return { header, body }
}

export function getLEBufferFromInfo ({ header: { typeId, typeName, time }, body }) {
  const dcrc = crc16ccitt(body)
  let nLen = body.length
  const info = {
    magic: magicNumber,
    hcrc: 0,
    time: time || Math.round(Date.now() / 1000),
    size: nLen,
    dcrc,
    typeId,
    typeName
  }
  info.hcrc = crc16ccitt(headerObjectToBuffer(info))
  let byData
  let index = 0
  let gnCRC = getInitCRC(info.typeId, info.typeName)
  let gnDataCRC = 0xffff
  while (nLen > 0) {
    byData = body[index] ^ (gnCRC & 0xFF)
    gnCRC = crc16ccitt(gnCRC, body.slice(index, index + 1))
    gnDataCRC = crc16ccitt(gnDataCRC, body.slice(index, index + 1))
    body[index] = byData
    index++
    nLen--
  }
  return Buffer.concat([headerObjectToBuffer(info), body])
}
