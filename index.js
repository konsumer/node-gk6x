import { devices, HID } from 'node-hid'
import crc16_ccitt from './crc16_ccitt.js'

// these are whould be shared by all GK96 keyboards
const vendorId = 0x1ea7
const productId = 0x0907

export class Gk6xDevice {
  static list () {
    return devices().filter(d => d.vendorId === vendorId && d.productId === productId)
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
      this.responses[ data[0] ] = data
    })
  }

  // cleanup handle & intervals
  close () {
    this.device.close()
  }

  // fire a command to keyboard
  // promise resolves on answer or errors on timeout
  cmd (cmd, sub_cmd = 0, header = 0, timeout = 1000, options = {}) {
    const buffer = Buffer.alloc(64)
    buffer.fill(0)
    buffer.writeUInt8(cmd, 0)
    buffer.writeUInt8(sub_cmd, 1)
    buffer.writeUInt32LE(header, 2)
    if (options?.body) {
      options.body.copy(buffer, 8, 0, options.body.length)
    }
    buffer.writeUInt16LE(crc16_ccitt(buffer), 6)
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

  // set keyboard mode
  changeMode(mode) {
    return this.cmd(0x0b, mode).then(buffer => buffer.readUInt8(1))
  }

  // check if the device is available
  ping () {
    return this.cmd(0x0c)
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
}
