import { devices, HID, setDriverType } from 'node-hid'
import * as opcodes from './opcodes.js'
import crc16_ccitt from './crc16_ccitt'

// porting from this: https://github.com/pixeltris/GK6X/blob/899885b5dd27e5a734806378bdaa344dfac1b65f/GK6X/KeyboardDevice.cs
export class Gk6xDevice {
  static list() {
    return devices().filter(d => d.vendorId === 0x1ea7 && d.productId === 0x0907)
  }

  constructor () {
    this.device = new HID(0x1ea7, 0x0907)
  }

  cmd (cmd, sub_cmd, header=0, body) {
    const buffer = Buffer.alloc(64)
    buffer.fill(0)
    buffer.writeUInt8(cmd, 0)
    buffer.writeUInt8(sub_cmd, 1)
    buffer.writeUInt32LE(header, 2)

    if (body) {
      body.copy(buffer, 8, 0, body.length);
    }
    
    buffer.writeUInt16LE(crc16_ccitt(buffer), 6)
  }

  setLayer (layer) {

  }

  setLighting (layer, userData) {

  }

  setMacros (layer, userData) {

  }

  setKeys (layer, values, fnPressed) {

  }

  setIdentifyDriverMacros () {

  }

  ping() {
    this.write(OpCodes.Ping)
  }
}

export class Gk6xFile {
  constructor(filename) {}

}