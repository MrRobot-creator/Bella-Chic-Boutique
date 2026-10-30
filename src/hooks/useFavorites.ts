import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'bella-chic-favorites'

const readFavorites = (): number[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter((id): id is number => Number.isInteger(id))
    }
    // Migra os favoritos antigos (uma chave "wishlist-<id>" por peça).
    const migrated: number[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      const match = key?.match(/^wishlist-(\d+)$/)
      if (match && localStorage.getItem(key as string) === 'true') migrated.push(Number(match[1]))
    }
    return migrated
  } catch {
    return []
  }
}

/** Peças favoritas salvas neste navegador. */
export const useFavorites = () => {
  const [favorites, setFavorites] = useState<number[]>(readFavorites)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // Sem armazenamento: os favoritos valem só nesta visita.
    }
  }, [favorites])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])

  /** Alterna a peça e devolve true quando ela passou a ser favorita. */
  const toggleFavorite = useCallback((id: number) => {
    const willAdd = !favorites.includes(id)
    setFavorites((current) => (willAdd ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)))
    return willAdd
  }, [favorites])

  return { favorites, isFavorite, toggleFavorite }
}
