import { describe, expect, it } from '@jest/globals'
import { webcrypto } from 'crypto'
import { contentFileName, fitInside, videoTypeOf } from './catalog'

describe('Redução das fotos no envio', () => {
  it('cabe em 1600 px no lado maior mantendo a proporção', () => {
    expect(fitInside(3000, 4000)).toEqual({ width: 1200, height: 1600 })
    expect(fitInside(4032, 3024)).toEqual({ width: 1600, height: 1200 })
  })

  it('não aumenta foto que já é pequena', () => {
    expect(fitInside(800, 1000)).toEqual({ width: 800, height: 1000 })
  })
})

describe('videoTypeOf', () => {
  it('reconhece MP4, MOV do iPhone e WebM pelo tipo', () => {
    expect(videoTypeOf({ name: 'a.mp4', type: 'video/mp4' })?.extension).toBe('mp4')
    expect(videoTypeOf({ name: 'IMG_0001.MOV', type: 'video/quicktime' })?.extension).toBe('mov')
    expect(videoTypeOf({ name: 'a.webm', type: 'video/webm' })?.extension).toBe('webm')
  })

  it('usa a extensão quando o celular não informa o tipo', () => {
    expect(videoTypeOf({ name: 'video.MOV', type: '' })?.contentType).toBe('video/quicktime')
    expect(videoTypeOf({ name: 'video.m4v', type: 'application/octet-stream' })?.contentType).toBe('video/mp4')
  })

  it('recusa o que não é vídeo aceito', () => {
    expect(videoTypeOf({ name: 'foto.jpg', type: 'image/jpeg' })).toBeUndefined()
    expect(videoTypeOf({ name: 'video.avi', type: 'video/x-msvideo' })).toBeUndefined()
    expect(videoTypeOf({ name: 'video.mp4', type: 'image/png' })).toBeUndefined()
  })
})

describe('contentFileName', () => {
  const bytes = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0)).buffer
  const subtle = webcrypto.subtle as unknown as SubtleCrypto

  it('dá o mesmo nome para o mesmo arquivo', async () => {
    expect(await contentFileName(bytes('abc'), 'jpg', subtle))
      .toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad.jpg')
    expect(await contentFileName(bytes('abc'), 'jpg', subtle)).toBe(await contentFileName(bytes('abc'), 'jpg', subtle))
  })

  it('dá nomes diferentes para arquivos diferentes', async () => {
    expect(await contentFileName(bytes('abc'), 'mp4', subtle)).not.toBe(await contentFileName(bytes('abd'), 'mp4', subtle))
  })

  it('sem criptografia no navegador, usa um nome aleatório', async () => {
    expect(await contentFileName(bytes('abc'), 'mov', null)).toMatch(/^\d+-[a-z0-9]+\.mov$/)
  })
})
