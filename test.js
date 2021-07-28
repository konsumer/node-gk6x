import { Gk6x, list } from './index.js'

test('should be able to find a real keyboard', () => {
  const keyboards = list()
  expect(keyboards.length).toBeGreaterThan(0)
})

test.skip('should be able to setup a device', () => {
  const device = new Gk6x()
  console.log(device)
})