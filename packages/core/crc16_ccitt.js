// Cylcic Redundancy Check (CRC-CCIIT 0xFFFF).
export const crc16ccitt = (regInit, message) => {
  if (typeof message === 'undefined') {
    message = regInit
    regInit = 0xFFFF
  }

  if (typeof message === 'string') {
    message = message.split('').map(c => c.charCodeAt(0))
  }

  let crc = regInit + 0
  const polynomial = 0x1021

  for (const b of message) {
    for (let i = 0; i < 8; i++) {
      const bit = ((b >> (7 - i) & 1) === 1)
      const c15 = ((crc >> 15 & 1) === 1)
      crc <<= 1
      if (c15 ^ bit) crc ^= polynomial
    }
  }

  crc &= 0xffff
  return crc
}

export default crc16ccitt
