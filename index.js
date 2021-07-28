import { devices, HID, setDriverType } from 'node-hid'
import * as opcodes from './opcodes.js'
import crc16_ccitt from './crc16_ccitt'

// these are whould be shared by all GK96 keyboards
const vendorId = 0x1ea7
const productId = 0x0907

export class Gk6xDevice {
  static list() {
    return devices().filter(d => d.vendorId === vendorId && d.productId === productId)
  }

  constructor () {
    this.timeout = 5000
    this.responses = {}
    this.intervals = {}

    const keyboards = Gk6xDevice.list()

    if (keyboards.length === 0) {
      throw new Error('No keyboard found.')
    }

    const first = keyboards[0]
    this.serialNumber = first.serialNumber
    this.manufacturer = first.manufacturer
    this.product = first.product
    this.release = first.release
    this.device = new HID(first.vendorId, first.productId)
    this.device.on('error', this.onError.bind(this))
    this.device.on('data', this.onData.bind(this))
  }

  // cleanup handle & intervals
  close() {
    Object.values(this.intervals).forEach(i => clearInterval(i))
    this.device.close()
  }

  // fire a command to keyboard
  // promise resolves on answer or errors on timeout
  cmd (cmd, sub_cmd=0, header=0, body) {
    const buffer = Buffer.alloc(64)
    buffer.fill(0)
    buffer.writeUInt8(cmd, 0)
    buffer.writeUInt8(sub_cmd, 1)
    buffer.writeUInt32LE(header, 2)

    if (body) {
      body.copy(buffer, 8, 0, body.length);
    }
    
    buffer.writeUInt16LE(crc16_ccitt(buffer), 6)

    // poll for response or timeout
    return new Promise((resolve, reject) => {
      clearInterval(this.intervals[cmd])
      delete this.responses[cmd]
      let timePassed = 0
      this.intervals[cmd] = setInterval(() => {
        timePassed += 100
        if (this.responses[cmd] || timePassed >= this.timeout) {
          clearInterval(this.intervals[cmd])
          delete this.intervals[cmd]
          if (this.responses[cmd]) {
            return resolve(this.responses[cmd])
          } else {
            reject(new Error(`Timeout of ${this.timeout} reached.`))
          }
        }
      }, 100)
      this.device.write(buffer)
    })
  }

  // take all responses from keyboard and put them in this.responses[cmd]
  onData(data) {
    const [cmd, ...params] = data
    clearInterval(this.intervals[cmd])
    delete this.intervals[cmd]
    this.responses[cmd] = params
    console.log('DATA', cmd, params)
  }

  // this hanbdles device-level errors
  onError(error) {
    console.error('ERROR', error)
  }

  ping() {
    return this.cmd(0x0C)
  }
}
