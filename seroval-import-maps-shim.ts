import type { Compilation, ResourcePlugin } from "@greenwood/cli";
// @ts-ignore
import { mergeImportMap } from "@greenwood/cli/src/lib/node-modules-utils.js";
import fs from 'node:fs';

const NODE_MODULES_LOCATION = new URL('./node_modules/', import.meta.url);
const PACKAGE_NAME = 'seroval-plugins';
let importMap: undefined | Map<string,string>;

function generateImportMap() {
  if(!importMap) {
    importMap = new Map();

    // just grab what we need - https://app.unpkg.com/seroval-plugins@1.3.2/files/package.json#L53
    fs.globSync('dist/esm/production/*.mjs', {
      cwd: `${NODE_MODULES_LOCATION.pathname}/${PACKAGE_NAME}/`
    }).forEach(file => {
      const resolved = new URL(`./${PACKAGE_NAME}/${file}`, NODE_MODULES_LOCATION);

      importMap.set(PACKAGE_NAME, `/~${resolved.pathname}`);
    });
  }

  return Object.fromEntries(importMap);
}

class SerovalPluginsImportMap {
  compilation: Compilation;

  constructor(compilation: Compilation) {
    this.compilation = compilation;
  }

  async shouldIntercept(url: URL, request: Request) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find((node) => node.route === pathname);

    return process.env.__GWD_COMMAND__ === "develop" &&
      protocol.startsWith("http") &&
      hasMatchingPageRoute && 
      request.headers.get("Accept").indexOf("text/html") >= 0;
  }

  async intercept(url: URL, request: Request, response: Response) {
    const body = await response.text();
    const newBody = mergeImportMap(body, generateImportMap());

    return new Response(newBody);
  }
}

export function serovalPluginsImportMapPlugin(): ResourcePlugin {
  return {
    type: "resource",
    name: "seroval-plugins-import-map-plugin",
    provider: (compilation: Compilation) => new SerovalPluginsImportMap(compilation),
  };
}