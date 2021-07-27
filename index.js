import { devices, HID, setDriverType } from 'node-hid'
import * as opcodes from './opcodes'

// List all devices that could be a gk6x
// this is probly not really going to be used
export const list = () => devices().filter(d => d.vendorId === 7847 && d.productId === 2311)

// porting from this: https://github.com/pixeltris/GK6X/blob/899885b5dd27e5a734806378bdaa344dfac1b65f/GK6X/KeyboardDevice.cs
export class Gk6x {
  constructor () {
    this.device = new HID(7847, 2311)
  }

  write (op1, op2 = 0, packet = null, op3 = 0) {
    // TODO: look in to what node-hid feature-reports are, they might be better here
    return this.device.write([op1, op2, packet, op3])
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

// testing

const keyboards = list()
let currentKeyboard = keyboards.length-1
console.log(keyboards[currentKeyboard])

const device = new Gk6x()



