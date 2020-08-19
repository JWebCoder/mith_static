import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.65.0/testing/asserts.ts"

Deno.env.set('staticPath', Deno.cwd() + '/example')

Deno.test("server is created", async () => {
  const { default: app } = await import('./example/example.ts')
  assert(app, 'is not created')
})

Deno.test("serves a static file", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/static/data.html',
    {
      method: 'GET',
    }
  )
  const result = await response.text()
  app.close()
  assertEquals(result, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mith</title>
</head>
<body>
  Mythical middleware
</body>
</html>`)
  assertEquals(response.headers.get('content-type'), 'text/html; charset=utf-8')
})
  

Deno.test("file not found", async () => {
  const { default: app } = await import('./example/example.ts')
  app.listen({ port: 8000})
  const response = await fetch(
    'http://localhost:8000/static/foo.txt',
    {
      method: 'GET',
    }
  )
  const result = await response.text()
  app.close()
  assertEquals(response.status, 404)
  assertEquals(result, 'not found')
})
