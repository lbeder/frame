import log from 'electron-log'

import TokenLoader from '../../../../main/externalData/inventory/tokens'

jest.mock('eth-provider', () => () => mockEthProvider)

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

let tokenLoader, mockEthProvider

beforeEach(() => {
  mockEthProvider = { connected: true, setChain: jest.fn(), once: jest.fn(), off: jest.fn() }
  tokenLoader = new TokenLoader()
})

afterEach(() => {
  tokenLoader.stop()
})

describe('loading tokens', () => {
  it('loads the default token list initially', () => {
    const tokens = tokenLoader.getTokens([137])

    expect(tokens.length).toBeGreaterThan(50)
    expect(tokens.find((token) => token.name === 'Aave')).toBeTruthy()
  })

  it('starts the loader with the default list when the provider is unavailable', async () => {
    mockEthProvider.connected = false

    const test = tokenLoader.start().then(() => {
      expect(tokenLoader.getTokens([1]).length).toBeGreaterThan(0)
    })

    // wait for attempts to connect
    jest.advanceTimersByTime(60 * 1000)

    return test
  })

  it('loads the default token list for mainnet', () => {
    const tokens = tokenLoader.getTokens([1])

    expect(tokens.length).toBeGreaterThan(0)
  })

  it('fails to load tokens for an unknown chain', () => {
    const tokens = tokenLoader.getTokens([-1])

    expect(tokens.length).toBe(0)
  })
})

describe('#getBlacklist', () => {
  beforeEach(async () => {
    return tokenLoader.start()
  })

  it('returns all blacklisted tokens', () => {
    const blacklistedTokens = tokenLoader.getBlacklist().map((t) => t.name)

    expect(blacklistedTokens[0]).toEqual('HOPE Token')
  })

  it('returns blacklisted tokens from a specific chain', () => {
    const blacklistedTokens = tokenLoader.getBlacklist([137]).map((t) => t.name)

    expect(blacklistedTokens[0]).toEqual('Minereum')
  })
})
