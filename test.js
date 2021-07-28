/* global beforeAll, afterAll, test, expect */

import { Gk6xDevice } from './index.js'

// NOTE: You should have a keyboard attached & permissions to mess with HID for this to work

// use 1 device for all tests
let device
beforeAll(() => {
  device = new Gk6xDevice()
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

  // this is specific to my keyboard
  // expect(id).toBe(2485220896)
  // expect(version).toBe(271)
})

test('deviceId', async () => {
  const deviceId = await device.deviceId()
  expect(deviceId).toBeDefined()

  // this is specific to my keyboard
  // expect(deviceId).toBe('281474976710655')
})

test('modelId', async () => {
  const modelId = await device.modelId()
  expect(modelId).toBeDefined()

  // this is specific to my keyboard
  // expect(modelId).toBe(656801880)
})