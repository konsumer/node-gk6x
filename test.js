/* global beforeAll, afterAll, describe, test, expect */

import { Gk6xDevice, getInfoFromLEBuffer, getLEBufferFromInfo } from './index.js'
import { promises } from 'fs'

const { readFile } = promises

// NOTE: You should have a keyboard attached & permissions to mess with HID for this to work

// this is used for testing buffer-parsing of LE files
const mockLEBuffer = Buffer.from(
  '31464d430d2a00004c6cd15a730100002de40000020000004c49474854000000a51b0e1815d6026590976561281bfa242f3f27b52af9b527c8d99eb8996f824dabaffd06d633aca3b8640d5b46bc1888cf4ff1ed8c19440aa6d3c89c1474b1999a048a919a42d5af5616da29687c3a92b7e2ebc0bc1fe7760c96f417146c51b392d4ac9caff411dda3ca7504332919214d5e9f0599b93c17b687814ce3cd50666cc52687caa4c49637ab647ec472a118aa3ad017606bdeb4a2bb86fbd9f493fa6cf0a0df6705837fb3327dd380c8d5b2cf56039979732dad868a41bb7a5a991db1ab4ca08843d5a8d148cd3fba6f5311ebaeb3791f4e62d8210898f1e52437c72db392d400c8125887ab4a4831585c26e8c52adb506d12170cc41a28482cd944236ece12dfba755f8173f492fb5040729d3d23be46823efa597a458c103f74e026b3910971f382d0384295d21f53b8fbf0b57e04d02966b060d7d2c956d3a88f8c14a93df28cfddca43cd69bf8b522a4144ee6aae41f659ab6f874b8d6a3b34622c42721c7075e4f1861949a19cf45e54592c4',
  'hex'
)

// use 1 device for all tests
let device
let konsumer = false
beforeAll(async () => {
  device = new Gk6xDevice()
  device.changeMode(5)

  // This triggers tests for my specific keyboard by checking my linux machine-id, should be off for most people
  try {
    const machineId = (await readFile('/etc/machine-id')).toString().trim()
    konsumer = machineId === '84f096209afde91cef48331860db700f'
    process.stdout.write(`👍 You are ${konsumer ? 'konsumer, I will test your specific keyboard' : "not konsumer. That's ok."}\n\n`)
  } catch (e) {}
})

afterAll(() => {
  device.close()
})

describe('Gk6xDevice', () => {
  test('find a real keyboard', async () => {
    const keyboards = Gk6xDevice.list()
    expect(keyboards.length).toBeGreaterThan(0)
    expect(device).toBeDefined()
    expect(device.manufacturer).toBe('SEMITEK')
  })

  test('ping', async () => {
    // first byte of response is always the op-code that was sent
    const [cmd] = await device.ping()
    expect(cmd).toBe(0x0c)
  })

  test('version', async () => {
    const { id, version } = await device.version()
    expect(id).toBeDefined()
    expect(version).toBeDefined()

    if (konsumer) {
      expect(id).toBe(2485220896)
      expect(version).toBe(271)
    }
  })

  test('deviceId', async () => {
    const deviceId = await device.deviceId()
    expect(deviceId).toBeDefined()

    if (konsumer) {
      expect(deviceId).toBe('281474976710655')
    }
  })

  test('modelId', async () => {
    const modelId = await device.modelId()
    expect(modelId).toBeDefined()

    if (konsumer) {
      expect(modelId).toBe(656801880)
    }
  })

  test('matrix', async () => {
    const { col, row } = await device.matrix()
    expect(col).toBeDefined()
    expect(row).toBeDefined()

    if (konsumer) {
      expect(col).toBe(14)
      expect(row).toBe(8)
    }
  })

  test.skip('mess up keyboard by making it look like apple device', async () => {
    const r = await device.writeMacVid()
    console.log(r)
  })

  // this needs root because my udev rules don't even apply!
  test.skip('fix messed up keyboard', () => {
    Gk6xDevice.writeNormalVid()
  })
})

let leInfo

describe('LE Data', () => {
  test('create & check for all fields', () => {
    const leInfoCreate = {
      header: {
        time: 1523674188,
        typeName: 'LIGHT'
      },
      body: Buffer.from([])
    }

    // make sure the buffer has all the missing fields
    const le = getInfoFromLEBuffer(getLEBufferFromInfo(leInfoCreate))

    expect(le.header.magic).toBe(0x434D4631)
    expect(le.header.hcrc).toBe(51087)
    expect(le.header.time).toBe(1523674188)
    expect(le.header.size).toBe(0)
    expect(le.header.dcrc).toBe(65535)
    expect(le.header.typeId).toBe(2)
    expect(le.header.typeName).toBe('LIGHT')
  })

  test('buffer -> info', () => {
    // get info object from a binary buffer
    const le = leInfo = getInfoFromLEBuffer(mockLEBuffer)

    expect(le.header.magic).toBe(0x434D4631)
    expect(le.header.hcrc).toBe(10765)
    expect(le.header.time).toBe(1523674188)
    expect(le.header.size).toBe(371)
    expect(le.header.dcrc).toBe(58413)
    expect(le.header.typeId).toBe(2)
    expect(le.header.typeName).toBe('LIGHT')
  })

  test('info -> buffer', () => {
    // get a binary buffer from info object
    const le = getInfoFromLEBuffer(getLEBufferFromInfo(leInfo))

    expect(le.header.magic).toBe(0x434D4631)
    expect(le.header.hcrc).toBe(10765)
    expect(le.header.time).toBe(1523674188)
    expect(le.header.size).toBe(371)
    expect(le.header.dcrc).toBe(58413)
    expect(le.header.typeId).toBe(2)
    expect(le.header.typeName).toBe('LIGHT')
  })
})
