# greenwood-lume

A demonstration repo of Greenwood and [**Lume**](https://lume.io/).

## Setup

1. Have Node >= 22.x (LTS) installed (or run `nvm use`)
1. Clone the repo
1. Run `npm ci`

Commands:

- `npm run dev` - start the dev server
- `npm start` - generate a production build and serve it

## Observations

### ✅ Three Dependency Missing 

Got an import maps error that a **three** import specifier could not be found
```
Uncaught TypeError: Failed to resolve module specifier "three/src/core/Object3D.js". Relative references must start with either "/", "./", or "../".
```

Checking with npm, I could see that **three** _was_ technically in the dependency graph
```sh
greenwood-lume@1.0.0 /Users/owenbuckley/Workspace/github/greenwood-lume
└─┬ lume@0.3.0-alpha.44
  ├─┬ @lume/three-projected-material@0.3.1
  │ └── three@0.174.0 deduped
  └── three@0.174.0
```

But it is only [a `peerDependency` of **lume**](https://unpkg.com/browse/lume@0.3.0-alpha.44/package.json), but I didn't see it explicitly [called out in the docs](https://docs.lume.io/guide/install) that this package needed to be vendored as such?

----

Maybe I just missed it, but recommendation would be to call out three as a `peerDependency` of Lume in the docs.

### ⚠️ Empty Main

When tunning the dev server, there will be a message in regards to **csstype**, since it has an [empty `main` field](https://unpkg.com/browse/csstype@3.1.3/package.json) in its _package.json_.

```sh
- ERROR (ERR_MODULE_NOT_FOUND): unable to resolve specifier => `csstype`
Cannot find package '/Users/owenbuckley/Workspace/github/greenwood-lume/node_modules/csstype' imported from /Users/owenbuckley/Workspace/github/greenwood-lume/node_modules/@greenwood/cli/src/lib/walker-package-ranger.js
```

----

Not much Greenwood can do here, and this already seems to fall into the known issues category [already documented on the website](https://greenwoodjs.dev/docs/introduction/web-standards/#compatibility), which is pretty common of these "types"-only kind of packages.

### 🚫 Missing Default Export Condition

In the case of [**seroval-plugins**](https://unpkg.com/browse/seroval-plugins@1.2.1/package.json) there was _only_ a custom export condition, and no default / main entry condition in the exports map

```json
{
  "exports": {
    "./web": {
      "...": "..."
    }
  },
}
```

Which meant `import.meta.url` failed to resolve the _package.json_ lookup:

```sh
- ERROR (ERR_PACKAGE_PATH_NOT_EXPORTED): unable to resolve specifier => `seroval-plugins`
No "exports" main defined in /Users/owenbuckley/Workspace/github/greenwood-lume/node_modules/seroval-plugins/package.json imported from /Users/owenbuckley/Workspace/github/greenwood-lume/node_modules/@greenwood/cli/src/lib/walker-package-ranger.js
```

----

Custom export conditions aside, the exports map spec expects at minimum a `.` export condition.  Like [other packages in that ecosystem](https://unpkg.com/browse/seroval@1.2.1/package.json), the easiest solution would be to just rename `./web` -> `.`, or have both.

### ❓ Array Based Export Conditions

> _**UPDATE: This one lands in a gray area, since after reaching out to some NodeJS folks, support for this seems discouraged, which explained why it was not documented (anymore).  So this seems like it might be an option for Greenwood to support._

Noticed this message from Greenwood when running the dev server for all these packages; [**gen-mapping**](https://unpkg.com/browse/@jridgewell/gen-mapping@0.3.8/package.json), [**set-array**](https://unpkg.com/browse/@jridgewell/set-array@1.2.1/package.json), [**sourcemap-codec**](https://unpkg.com/browse/@jridgewell/sourcemap-codec@1.5.0/package.json), [**trace-mapping**](https://unpkg.com/browse/@jridgewell/trace-mapping@0.3.25/package.json), [**resolve-uri**](https://unpkg.com/browse/@jridgewell/resolve-uri@3.1.2/package.json)

```sh
- no supported export conditions (`import, module-sync, default`) for dependency => `@jridgewell/gen-mapping`
- no supported export conditions (`import, module-sync, default`) for dependency => `@jridgewell/set-array`
- no supported export conditions (`import, module-sync, default`) for dependency => `@jridgewell/sourcemap-codec`
- no supported export conditions (`import, module-sync, default`) for dependency => `@jridgewell/trace-mapping`
- no supported export conditions (`import, module-sync, default`) for dependency => `@jridgewell/resolve-uri`
```

This looks to be related to usage of Arrays inside export map conditions, which is something I haven't seen before?

```json
{
  "exports": {
    ".": [
      {
        "types": "./dist/types/gen-mapping.d.ts",
        "browser": "./dist/gen-mapping.umd.js",
        "require": "./dist/gen-mapping.umd.js",
        "import": "./dist/gen-mapping.mjs"
      },
      "./dist/gen-mapping.umd.js"
    ],
    "./package.json": "./package.json"
  },
}
```

----

Will have to confirm if this is expected, since I couldn't find any reference to this in the [NodeJS docs](https://nodejs.org/api/packages.html#package-entry-points) per se, but [the signature for `exports` in the docs](https://nodejs.org/api/packages.html#exports) seems to imply as much?

```md
Type: <Object> | <string> | <string[]>
```

 but I did find a blog post that seems to reference this as a ["fallback array"](https://hirok.io/posts/package-json-exports#fallback-array-advanced)?


### ❓ Custom Export Map Conditions

In the case of [**seroval-plugins**](https://unpkg.com/browse/seroval-plugins@1.2.1/package.json) there was (only) a custom export condition

```json
{
  "exports": {
    "./web": {
      "development": {
        "require": "./dist/cjs/development/web.cjs",
        "import": "./dist/esm/development/web.mjs"
      },
      "require": "./dist/cjs/production/web.cjs",
      "import": "./dist/esm/production/web.mjs",
      "types": "./dist/types/web/index.d.ts"
    }
  },
}
```

This is probably something for Greenwood to handle through configuration most likely, since [custom user conditions are valid through the exports map spec](https://nodejs.org/api/packages.html#resolving-user-conditions).

> Note: As called out earlier, this package would still fail even with custom user conditions support for the reason it does not at least have a default export condition (`.`).

### ❓ Deep-linked `main` imports

Packages like [**lowclass**](https://unpkg.com/browse/lowclass@8.0.2/package.json) / [**@lume/custom-attributes**](https://unpkg.com/browse/@lume/custom-attributes@0.3.0/package.json) / [**@lume/three-projected-material**](https://unpkg.com/browse/@lume/three-projected-material@0.4.0/package.json) do not have any `exports` field, but are [referenced from other packages](https://unpkg.com/browse/lume@0.3.0-alpha.44/src/behaviors/InitialBehaviors.ts) using a pattern of "deep" `main` imports, e.g.

```js
import {Constructor} from 'lowclass/dist/Constructor.js'
```

This causes import map related errors to these specifiers

```sh
Uncaught TypeError: Failed to resolve module specifier "lowclass/dist/Constructor.js". Relative references must start with either "/", "./", or "../".
```

> Is this an example of [self-referencing](https://nodejs.org/api/packages.html#self-referencing-a-package-using-its-name)?

----

Not sure if there is a way to support this that I'm just not realizing, but certainly the simplest solution would be to just add an exports map to the package, especially as they are already marked with `"type": "module"` in _package.json_

```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./dist/*": "./dist/*"
  },
}
```

Or support distribution / imports from `main` like this:

```js
import {Constructor} from 'lowclass'
```

## Upstreams

### Greenwood

Some tasks and questions for Greenwood to investigate

1. [x] import map race condition - https://github.com/ProjectEvergreen/greenwood/issues/1425 
1. [x] (TBD) Are array based export conditions supported? - https://github.com/ProjectEvergreen/greenwood/discussions/1436
  - kind of... but seemingly they are not documented for a reason based on chats with NodeJS friends
  - that said, they are spec'd and know to some degree, so perhaps some basic support could be added to Greenwood
1. [x] (TBD) Custom export map conditions - https://github.com/ProjectEvergreen/greenwood/discussions/1436
  - Should probably consider supporting custom export map conditions? (e.g. [`./web`](https://unpkg.com/browse/seroval-plugins@1.2.1/package.json)) through configuration, since this technically is allowed via the spec
1. [x] (TBD) - Deep `main` exports - https://github.com/ProjectEvergreen/greenwood/discussions/1436
1. [ ] There's seem to be a bug in the pattern Regex in regards to the `/` when trying to load three
    ```js
    // before
    pattern = pattern.replace(/\*/g, "[^/]*");

    // after - no /
    pattern = pattern.replace(/\*/g, "[^]*");
    ```
1. [ ] inline Lume `<script>` tags breaks during production build

### Lume (and friends)

Some recommended upstream changes to packages observed so far.  Additional items may be added once some of the questions above have been resolved.

1. ✅ (Lume) Explicitly call-out **three** as needing to be manually installed by the user
1. 🚫 (Seroval Plugins) Need to _at least_ have a default exports map condition (e.g. `.`)
1. ⚠️ (@jridgewell packages) Move away from "discontinued" array / fallback export conditions
1. ⚠️ (Seroval Plugins) Ideally avoid bespoke export map conditions, but technically probably something that could be supported in Greenwood.