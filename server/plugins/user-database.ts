import { closeUserDatabase } from '../utils/userDatabase'

export default defineNitroPlugin((app) => {
  app.hooks.hook('close', closeUserDatabase)
})
