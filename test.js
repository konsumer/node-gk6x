import { Gk6xDevice } from './index.js'

// NOTE: You should have a keyboard attached & permissions to list hid for this to work

test('should be able to find a real keyboard', () => {
  const keyboards = Gk6xDevice.list()
  expect(keyboards.length).toBeGreaterThan(0)
})

test.skip('should be able to setup a device', () => {
  const device = new Gk6xDevice()
  console.log(device)
})