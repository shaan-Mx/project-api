import fs from 'fs/promises'

export const readFromJson = async <T>(filePath: string): Promise<T[]> => {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erreur lecture fichier:', error)
    return []
  }
}

export const writeToJson = async <T>(data: T[], filePath: string): Promise<boolean> => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('Erreur écriture fichier:', error)
    return false
  }
}
