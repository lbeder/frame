import Restore from 'react-restore'

import store from '../../../../../../main/store'
import link from '../../../../../../resources/link'
import { screen, render } from '../../../../../componentSetup'
import AddAdressComponent from '../../../../../../app/dash/Accounts/Add/AddAddress'

jest.mock('../../../../../../main/store/persist')
jest.mock('../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const AddAddress = Restore.connect(AddAdressComponent, store)
const address = '0x690B9A9E9aa1C9dB991C7721a92d351Db4FaC990'

it('allows a user to enter an address', async () => {
  render(<AddAddress />)

  expect(screen.getByText('input address')).toBeTruthy()
  expect(screen.getByRole('textbox')).toBeTruthy()
})

it('adds an account by address', async () => {
  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(address)
  await clickCreate()

  expect(link.rpc).toHaveBeenCalledWith('createFromAddress', address, 'Watch Account', expect.any(Function))
})

it('shows a success screen after adding an account by address', async () => {
  const { enterText, clickCreate } = setupComponent(<AddAddress />)

  await enterText(address)
  await clickCreate()

  expect(screen.getByText('account added successfully')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'back' })).toBeTruthy()
})

function setupComponent() {
  const { user } = render(<AddAddress />)

  return {
    user,
    enterText: async (text) => user.type(screen.getByLabelText('input address'), text),
    clickCreate: async () => user.click(screen.getByRole('button', { name: 'Create' }))
  }
}
