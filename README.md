# Mith_Static

![mith ci](https://github.com/JWebCoder/mith_static/workflows/mith%20static%20ci/badge.svg)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/mith_static/mod.ts)

Serve static files under [Mith framework](https://github.com/JWebCoder/mith)

## Usage

**Basic integration**
```typescript
import { Mith } from 'https://deno.land/x/mith@v0.7.0/mod.ts'
import { serverStatic } from 'https://deno.land/x/mith_static@v0.0.1/mod.ts'

const { env } = Deno

const app = new Mith()
app.use(serveStatic(resolve(Deno.cwd(), 'static'), '/static', {
  maxage: 120,
}))
app.use((req, res, next) => {
  if (!req.requestHandled) {
    return next({status: 404, message:'not found'})
  }
  next()
})
app.error(
  (req: Request, res: Response, next: NextFunction) => {
    if (res.error) {
      res.status = res.error.status || 500
      res.body = res.error.message
    }
    next()
  }
)

const PORT = Number(env.get('PORT')) || 8000
app.listen({ port: PORT})
console.log('listening on', PORT)
```

Right now I'm still working on the documentation, so you can check the **example** folder for full usage examples
