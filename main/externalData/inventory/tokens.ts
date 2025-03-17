import log from 'electron-log'

import ethProvider from 'eth-provider'

import defaultTokenList from './default-tokens.json'

import type { Token } from '../../store/state'

import { STATIC_TOKENS } from '../static'

interface TokenSpec extends Token {
  extensions?: {
    omit?: boolean
  }
}

function isBlacklisted(token: TokenSpec) {
  return token.extensions?.omit
}

export default class TokenLoader {
  private tokens: TokenSpec[] = defaultTokenList.tokens as TokenSpec[]
  private nextLoad?: NodeJS.Timeout | null

  private readonly eth = ethProvider('frame', { origin: 'frame-internal', name: 'tokenLoader' })

  constructor() {
    this.eth.setChain('0x1')
  }

  private async loadTokenList(timeout = 60_000) {
    try {
      const updatedTokens = await this.fetchTokenList(timeout)
      log.info(`Fetched ${updatedTokens.length} tokens`)
      this.tokens = [...updatedTokens]
      log.info(`Updated token list to contain ${this.tokens.length} tokens`)

      this.nextLoad = setTimeout(() => this.loadTokenList(), 10 * 60_000)
    } catch (e) {
      log.warn('Could not fetch token list', e)

      this.nextLoad = setTimeout(() => this.loadTokenList(), 30_000)
    }
  }

  private async fetchTokenList(timeout: number) {
    log.verbose('Fetching tokens from a local DB')

    let timeoutHandle: NodeJS.Timeout | undefined
    const requestTimeout = new Promise<TokenSpec[]>((resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        reject('Timeout fetching token list from local DB')
      }, timeout)
    })

    const cancelTimeout = () => clearTimeout(timeoutHandle)

    return Promise.race([requestTimeout, this.resolveTokens()]).finally(cancelTimeout)
  }

  private async resolveTokens() {
    return STATIC_TOKENS
  }

  async start() {
    log.verbose('Starting token loader')

    return new Promise<void>((resolve) => {
      const startLoading = async () => {
        clearTimeout(connectTimeout)

        // use a lower timeout for the first load
        await this.loadTokenList(8000)

        finishLoading()
      }

      const finishLoading = () => {
        this.eth.off('connect', onConnect)
        resolve()
      }

      const connectTimeout = setTimeout(() => {
        log.warn('Token loader could not connect to provider, using default list')
        finishLoading()
      }, 5 * 1000)

      const onConnect = startLoading.bind(this)

      if (this.eth.connected) return startLoading()

      this.eth.once('connect', onConnect)
    })
  }

  stop() {
    if (this.nextLoad) {
      clearInterval(this.nextLoad)
      this.nextLoad = null
    }
  }

  getTokens(chains: number[]) {
    return this.tokens.filter((token) => !isBlacklisted(token) && chains.includes(token.chainId))
  }

  getBlacklist(chains: number[] = []) {
    const chainMatches = (token: TokenSpec) => !chains.length || chains.includes(token.chainId)

    return this.tokens.filter((token) => isBlacklisted(token) && chainMatches(token))
  }
}
