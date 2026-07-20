import {
  mkdtemp,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  describe,
  it,
  expect
} from 'vitest'
import { loadConfig } from './config.ts'

describe('cli', () => {
  describe('config', () => {
    describe('loadConfig', () => {
      it('should load config module by path', async () => {
        const dir = await mkdtemp(join(tmpdir(), 'srcset-cli-'))
        const file = join(dir, 'srcset.config.js')

        await writeFile(file, 'export default { dest: "dist", skipOptimization: true }\n')

        expect(await loadConfig(file)).toEqual({
          dest: 'dist',
          skipOptimization: true
        })
      })

      it('should return empty object without config', async () => {
        expect(await loadConfig()).toEqual({})
      })
    })
  })
})
