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

test('should be able to find a real keyboard', async () => {
  const keyboards = Gk6xDevice.list()
  expect(keyboards.length).toBeGreaterThan(0)
  expect(device).toBeDefined()
})
