/* global beforeAll, afterAll, test, expect */

import { Gk6xDevice } from './index.js'

// NOTE: You should have a keyboard attached & permissions to mess with HID for this to work

// This triggers tests for my specific keyboard, should be off for most people
const konsumer = true

// use 1 device for all tests
let device
beforeAll(() => {
  device = new Gk6xDevice()
  device.changeMode(5)
})

afterAll(() => {
  device.close()
})

test('find a real keyboard', async () => {
  const keyboards = Gk6xDevice.list()
  expect(keyboards.length).toBeGreaterThan(0)
  expect(device).toBeDefined()
  expect(device.manufacturer).toBe('SEMITEK')
})

test('ping', async () => {
  const [cmd] = await device.ping()

  // first byte of response is always the op-code
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
  }
})

// I skip this because it alters the keyboard
test.skip('writeMacVid', async () => {
  const r = await device.writeMacVid()
  console.log(r)
})
