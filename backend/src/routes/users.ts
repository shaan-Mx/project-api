import { Router, Request, Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { User } from '../types/index'
import { readFromJson, writeToJson } from '../utils/file'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json')

// GET tous les utilisateurs
router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<User>(DATA_FILE)

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
    //res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des données' })
  }
})

// GET un utilisateur par ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<User>(DATA_FILE)
    const user = data.find((u: User) => u.id === parseInt(req.params.id))

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST créer un utilisateur
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<User>(DATA_FILE)
    const newUser: User = {
      id: data.length > 0 ? Math.max(...data.map((u: User) => u.id)) + 1 : 1,
      ...req.body,
      created_at: new Date().toISOString(),
    }
    data.push(newUser)
    await writeToJson(data, DATA_FILE)
    res.status(201).json(newUser)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la création' })
  }
})

// PUT mettre à jour un utilisateur
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<User>(DATA_FILE)
    const index = data.findIndex((u: User) => u.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    data[index] = {
      ...data[index],
      ...req.body,
      id: parseInt(req.params.id),
    }

    await writeToJson(data, DATA_FILE)
    res.json(data[index])
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' })
  }
})

// DELETE supprimer un utilisateur
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const data = await readFromJson<User>(DATA_FILE)
    const index = data.findIndex((u: User) => u.id === parseInt(req.params.id))

    if (index === -1) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    data.splice(index, 1)
    await writeToJson(data, DATA_FILE)

    res.json({ message: `User ${req.params.id} deleted` })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression' })
  }
})

export default router
