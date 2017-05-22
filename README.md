xeats.io sdk
===

### Getting started

1. Sign up in `https://xeats.io`.
2. Use `email` and `password` to get `access_key` and `secret`. Visit [documents](https://xeats.io/documents/api) for more. NOTE: use this SDK require `access_key` and `secret`. 
3. Put HTML into your page or watch - [Demo (creating seats)](https://jsfiddle.net/pjchender/5yuffu1y/) and [Demo (booking seats)](https://jsfiddle.net/pjchender/vwrtsktr/) directly.

```html
<div id="seat-map"></div>
```

4. Add sdk and scripts.
```html
<script src="https://unpkg.com/xeats-sdk/"></script>
```

### Use on the Web

For User to Create Manager:

```html
<script>
// NOTICE: For User to create Manager
(function () {
  var xeat = new Xeats.ManagerMap({
    el: '#seat-map',
    accessKey: '70abb94c-0a4e-4b60-b228-d3e17f2eb4ad',
    secret: '2a669a9ec56ae69bd0be2de0c3c81b79',
    /**
     * The unique key for create a seats.
     * You can name it as hash or event name.
     * NOTE: it decide which seats you use.
     * Each time you make a new name will create another seats.
     */
    seatsKey: 'create',
    categories: ['A', 'B', 'C', 'D'],
    zoomMax: 4,         // default is 2
    zoomMin: 0.5,       // default is 0.5
    width: 'auto',      // For responsive set value to `auto`
    height: 800         // Height can not set to auto
  })
})()
</script>
```

For User to Book Seats:

```html
<script>
// NOTICE:For user to book seats
(function () {
  var xeat = new Xeats.UserMap({
    el: '#seat-map',
    accessKey: '70abb94c-0a4e-4b60-b228-d3e17f2eb4ad',
    seatsKey: 'create',
    zoomMax: 4,
    zoomMin: 0.5,
    width: 'auto',    // For responsive set value to `auto`
    height: 800,      // Height can not set to auto
    amountMax: 4,     // Limit selection amount
    amountMin: 1
  })
})()
</script>
```

### Use with Node

```shell
npm install --save xeats-sdk
```
We support using ES2015+/Commonjs

```js
// ES 2015+
import Xeats from 'xeats-sdk'

// Commonjs
const Xeat = require('xeats-sdk')

new Xeats.ManagerMap({...})
new Xeats.UserMap({...})
```

# Development

Run `npm run dev` to start the webpack-dev-server on your local device.
Run `npm run build` to bundle a xeats-sdk.js for production.

There are currently four VUE components in the package.
- `user-booking`: This component will show the seats map and seats information for user to book the seat.
- `management`: This component is for managers to choose spots, create seats, change seats status, change seats shape, also to categorize seats.
- `spots-list`: This component is embeded in `management` component, which will get the list of authorized spots for user to change current spots.
- `v-frame`: This component is for embeding other components in an iframe.


# Changelog

* `2017-05-19` Accomplish changing seats shape
* `2017-05-03` Accomplish APIs with a document of API.(Alpha/Draft)
* `2017-03-24` Accomplish v-pan-zoom.
* `2017-03-21` Finish zoom in out and pick plugins.

# Contributors

[![](https://avatars3.githubusercontent.com/u/665690?v=3&s=60)](https://github.com/andyyou) [![](https://avatars1.githubusercontent.com/u/13399740?v=3&s=60)](https://github.com/PJCHENder)

# Issues

# Roadmap