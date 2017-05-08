xeats.io sdk
===

### Getting started

1. Sign up in `https://xeats.io`.
2. Use `email` and `password` to get `access_key` and `secret`. Visit [documents](https://xeats.io/documents/api) for more. NOTE: use this SDK require `access_key` and `secret`. 
3. Put HTML into your page or watch [Demo](https://jsfiddle.net/5yuffu1y/2/) directly.

```
<div id="seat-map"></div>
```

4. Add sdk and script as follow:

```html
<script src="dist/sdk.js"></script>
<script>
  (function () {
    var xeat = new Xeat.default({
      el: '#seat-map',
      accessKey: 'ff5c1d60-ef8d-4284-82c1-35e8be350e34',
      secret: '61b4311e47a8dfce2c0819e95100e95f',
      component: {
        name: 'admin-create', // admin-create | admin-edit | user-booking
        sourceId: '58ef43548095d200324f7e66',
        data: {
          categories: ['A', 'B', 'C', 'D']
        }
      },
      zoomMax: 2,
      zoomMin: 0.5,
      width: 'auto',    // For responsive set value to `auto`
      height: 800,
      amountMax: 4,     // Limit selection amount
      amountMin: 1
    })
  })()
</script>
```

Or use ES2015+/Commonjs

```js
// ES 2015+
import Xeat from 'xeats-sdk'

// Commonjs
var Xeat = require('xeats-sdk').default
```

# Development

```bash
$ npm run dev

$ npm run build
```

# Changelog

* `2017-05-03` Accomplish APIs with a document of API.(Alpha/Draft)
* `2017-03-24` Accomplish v-pan-zoom.
* `2017-03-21` Finish zoom in out and pick plugins.

# Contributors

[![](https://avatars3.githubusercontent.com/u/665690?v=3&s=60)](https://github.com/andyyou) [![](https://avatars1.githubusercontent.com/u/13399740?v=3&s=60)](https://github.com/PJCHENder)

# Issues

# Roadmap