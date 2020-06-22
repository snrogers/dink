import { isAnyOf } from './index'

describe('utility functions', () => {
  describe('isAnyOf', () => {
    it('returns TRUE if val is ANY of the candidates', () => {
      expect(isAnyOf([ 1, 2, 3 ], 2))
        .toEqual(true)
    })

    it('returns FALSE if val is NONE of the candidates', () => {
      expect(isAnyOf([ 1, 2, 3 ], 100))
        .toEqual(false)
    })
  })
})
