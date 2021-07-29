import crc16ccitt from './crc16_ccitt.js'
export const LETypes = ['_', 'PROFILE', 'LIGHT', 'STATASTIC', 'APPCONF', 'MACRO']

// did it come from the correct place? Bad way to check, but ok
export const magicNumber = 0x434D4631

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

// this will turn an LE file buffer into an object with header (info) and body (buffer to send to device)
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

// this is basically to save an LE file from an info-object
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
