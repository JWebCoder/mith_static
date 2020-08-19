import {
  Mith,
  serveStatic,
  resolve,
  NextFunction
} from './deps.ts'

const { env } = Deno

const app = new Mith()
app.use(serveStatic(resolve(env.get('staticPath') || Deno.cwd(), 'static'), '/static', {
  maxage: 120,
}))
app.use((req, res, next) => {
  if (!req.requestHandled) {
    return next({status: 404, message:'not found'})
  }
  next()
})
app.error(
  (req, res, next: NextFunction) => {
    if (res.error) {
      res.status = res.error.status || 500
      res.body = res.error.message
    }
    next()
  }
)

export default app