/*!
 * cookie-session
 * Copyright(c) 2020 João Moura
 * MIT Licensed
 */

import { sep, normalize, extname } from "https://deno.land/std@0.65.0/path/mod.ts"
import { contentType } from "https://deno.land/x/media_types@v2.4.5/mod.ts"
import { NextFunction, IResponse } from 'https://deno.land/x/mith@v0.9.6/mod.ts'
import debug from 'https://raw.githubusercontent.com/rista404/deno-debug/75400f612c8051b1f57ecc5c037df9138507592a/debug.ts'
let logger = debug('static')

const UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/;

interface ReadOptions {
  encoding?: string;
}


function readFileStrSync(filename: string, opts: ReadOptions) {
  const decoder = new TextDecoder(opts.encoding);
  return decoder.decode(Deno.readFileSync(filename));
}

function isHidden(path: string) {
  const pathArr = path.split(sep)
  for (const segment of pathArr) {
    if (segment[0] === ".") {
      return true
    }
    return false
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    return (await Deno.stat(path)).isFile;
  } catch {
    return false;
  }
}

export interface options {
  root?: string,
  fallthrough?: boolean,
  immutable?: boolean,
  maxage?: number
}

/**
 * Module exports.
 * @public
 */
/**
 * Create a new static server middleware.
 *
 * @param {string} [root] Root path to server
 * @param {object} [options]
 * @param {boolean} [options.fallthrough=true]
 * @param {boolean} [options.immutable=false]
 * @param {number} [options.maxage=0]
 * @return {function} Middleware
 * @public
 */

export function serveStatic(root: string, endpoint: string, options: options = {}) {
  const {
    fallthrough = true,
    immutable = false,
    maxage = 0,
  } = options;
  if (!root) {
    throw new Error('root path required')
  }

  if (endpoint.charAt(0) !== '/') {
    endpoint = '/' + endpoint
  }

  if (typeof root !== 'string') {
    throw new TypeError('root path must be a string')
  }
  
  return async (req: any, res: IResponse, next: NextFunction) => {
    logger('running')
    logger(req.serverRequest.url)
    if (req.serverRequest.url.indexOf(endpoint) !== 0) {
      return next()
    }
    
    if (req.serverRequest.method !== 'GET' && req.serverRequest.method !== 'HEAD') {
      if (fallthrough) {
        return next()
      }

      // method not allowed
      res.status = 405
      res.headers.set('Allow', 'GET, HEAD')
      res.headers.set('Content-Length', '0')
      res.sendResponse()
      return
    }

    let path = root + '/' + req.serverRequest.url.replace(endpoint, '')
    // containing NULL bytes is malicious
    if (path.includes("\0")) {
      return next({message: 'Malicious Path', status: 400})
    }

    // path outside root
    if (UP_PATH_REGEXP.test(path)) {
      return next({message: 'Forbidden', status: 403})
    }

    path = normalize(path)

    if (isHidden(path)) {
      return next({message: 'Forbidden', status: 403})
    }

    logger('path', path)
    if (!await exists(path)) {
      if (fallthrough) {
        return next()
      }
      return next({message: 'Not found', status: 404})
    }

    const fileInfo = await Deno.stat(path)
    if (fileInfo.isDirectory) {
      return next({message: 'Forbidden', status: 403})
    }

    logger('extname(path)', extname(path), path)
    const mimeType = contentType(extname(path))
    if (!mimeType) {
      return next({message: 'Not found', status: 404})
    }
    res.headers.set("Content-Length", String(fileInfo.size));
    res.headers.set('Content-Type', mimeType)
    if (!res.headers.has("Last-Modified") && fileInfo.mtime) {
      res.headers.set("Last-Modified", fileInfo.mtime.toUTCString());
    }
    if (!res.headers.has("Cache-Control")) {
      const directives = [`max-age=${maxage | 0}`];
      if (immutable) {
        directives.push("immutable");
      }
      res.headers.set("Cache-Control", directives.join(","));
    }
   
    res.body = await Deno.open(path, { read: true })
    req.requestHandled = true
    logger('sending file')
    res.sendResponse().finally(
      () => {
        if (res.body.rid) {
          Deno.close(res.body.rid)
        }
      }
    )
  }
}
