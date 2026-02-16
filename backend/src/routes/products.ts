import { Router, Request, Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { Product } from '../types/index'
import { readFromJson, writeToJson } from '../utils/file'
import { applyCriteria, type SearchCriteria } from '../utils/query'


const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.join(__dirname, '..', 'data', 'products.json')

// GET all products
router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<Product>(DATA_FILE)
    // Récupérer les paramètres de query
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0
    // Appliquer la pagination si limit est défini
    let paginatedData = data
    if (limit !== undefined) {
      paginatedData = data.slice(offset, offset + limit)
    }
    // Retourner les données avec métadonnées
    res.json({
      data: paginatedData,
      total: data.length,
      limit: limit || data.length,
      offset: offset,
      hasMore: offset + (limit || data.length) < data.length
    })
    // res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des données' })
  }
})

// GET a product by Id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<Product>(DATA_FILE)
    const reqId = req.params.id
    const found = data.find((p: Product) => p.id === reqId)
    if (!found) {
      return res.status(404).json({ error: `Product not found with id:${reqId}` })
    }
    res.json(found)
  } catch (error) {
    res.status(500).json({ error: 'Error server' })
  }
})

// ✅ POST /search - Recherche avec critères
router.post('/search', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<Product>(DATA_FILE)
    const criteria: SearchCriteria = req.body
    console.log('/search criteria=',criteria)
    // ✅ 1. D'abord filtrer et trier (SANS limit/offset)
    const criteriaWithoutPagination = {
      where: criteria.where,
      orderBy: criteria.orderBy
      // PAS de limit ni offset ici
    }
    const filteredData = applyCriteria(data, criteriaWithoutPagination)
    // ✅ 2. Calculer le total APRÈS filtrage mais AVANT pagination
    const total = filteredData.length
    // ✅ 3. Appliquer la pagination manuellement
    const limit = criteria.limit || total
    const offset = criteria.offset || 0
    const paginatedData = filteredData.slice(offset, offset + limit)
    // ✅ 4. Retourner les données paginées avec le bon total
    res.json({
      data: paginatedData,
      total: total,  // ✅ Total des résultats filtrés (pas paginés)
      limit: limit,
      offset: offset,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ error: 'Search error' })
  }
})

// POST créer un produit
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<Product>(DATA_FILE)
    const newProduct: Product = {
      id: data.length > 0 ? Math.max(...data.map((p: Product) => parseInt(p.id))) + 1 : 1,
      ...req.body,
    }
    data.push(newProduct)
    await writeToJson(data, DATA_FILE)
    res.status(201).json(newProduct)
  } catch (error) {
    res.status(500).json({ error: 'Create error' })
  }
})

// PUT mettre à jour un produit
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<Product>(DATA_FILE)
    const reqId = req.params.id
    const index = data.findIndex((p: Product) => p.id === reqId)
    if (index === -1) {
      return res.status(404).json({ error: `Product not found with id:${reqId}` })
    }
    data[index] = {
      ...data[index],
      ...req.body,
      id: reqId,
    }
    await writeToJson(data, DATA_FILE)
    res.json(data[index])
  } catch (error) {
    res.status(500).json({ error: 'Update error' })
  }
})

// DELETE supprimer un produit
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<Product>(DATA_FILE)
    const reqId = req.params.id
    const index = data.findIndex((p: Product) => p.id === reqId)
    if (index === -1) {
      return res.status(404).json({ error: `Product not found with id:${reqId}` })
    }
    data.splice(index, 1)
    await writeToJson(data, DATA_FILE)
    res.json({ message: `Product ${req.params.id} deleted` })
  } catch (error) {
    res.status(500).json({ error: 'Delete error' })
  }
})

export default router
