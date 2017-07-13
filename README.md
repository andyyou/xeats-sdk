xeats.io sdk
===

## What is xeats-sdk

`xeats-sdk` is the sdk provided by [xeats.io](http://xeats.io/). 
- For seats managers, this is for managing the seats map, setting tickets and categorizing seats for an activity. 
- For seats users, this is for participants who want to enroll an activity to book their seats.

## Getting started

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
    disableWheel: true,  // default is false
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
    disableWheel: true,  // default is false
    readOnly: true,   // default is false
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

## Feature

### Manager Map
When setting category on seats, manager now can pick multiple seats through Cmd/Alt Key.

## API Documentation

### ManagerMap

##### el
- Type: `String`
- Description: The Dom element ID for xeats to mount.
- Usage:
```js
el: '#seat-map',
```

##### accessKey
- Type: `String`
- Description: After registering on [xeats.io](http://xeats.io/), you can use xeats.io API to get the `accessKey`.

##### secrete
- Type: `String`
- Description: After registering on [xeats.io](http://xeats.io/), you can use xeats.io API to get the `secrete`.

##### seatsKey
- Type: `String`
- Description:  The unique key for create a seats map. You can name it as hash or event name. This decides which seats you use. Each time you make a new name will create a new seats.
- Usage:
```js
seatsKey: 'sandbox',
```

##### categories
- Type: `Array`
- Description: Set seat related information, such as ticket type, ticketId, or ticket pirce.
- Usage: Simply put an array of string to create different categories of seats:
```js
categories: ['Normal', 'Early Bird', 'Special', 'Free']
```
For setting detail of seats, put an array of object. Notice that the `comment` property can only accept `String`. If you want to put more seat related information, you can put in `info` property, which accept an `Object`. 

```js
categories: [
    {
        name: 'Free',
        info: {
            ticketId: 'free',
            price: 0
        },
        comment:"This is for student",
    },
    {
        name: 'Early-Bird',
        info: {
            ticketId: 'earlyBird',
            price: 200
        },
        comment:"This is for student",
    }
]
```
##### zoomMax
- Type: `Number`
- Description: The maximum scale level to zoom in for the seats map. Larger value can scale in a larger level. Default is `2`.

##### zoomMin
- Type: `Number`
- Description: The minimum scale level to zoom out for the seats map. Smaller value can scale in a smaller level. Default is `0.5`.

##### width
- Type: `Number` | `String`
- Description: Set the width of the seats map to show. For responsive, set value to `auto`.
- Usage: 
```js
width: 'auto',
// width: 720
```

##### height
- Type: `Number`
- Description: Set the height of the seats map to show. This value **can not** set to `auto`

##### disableWheel
- Type: `Boolean`
- Description: Disable the function of zooming on mouse wheel in seats map. Default is `false`.

#####   info
- Type: `Object`
- Description: You can put any information wanted to save in database.
```js
  info: {
    environment: 'development'
  }
```

## UserMap

##### el
- Type: `String`
- Description: The Dom element ID for xeats to mount.
- Usage:
```js
el: '#seat-map',
```

##### accessKey
- Type: `String`
- Description: After registering on [xeats.io](http://xeats.io/), you can use xeats.io API to get the `accessKey`.

##### seatsKey
- Type: `String`
- Description:  The unique key to get the seats map.
- Usage:
```js
seatsKey: 'sandbox',
```

##### zoomMax
- Type: `Number`(optional)
- Description: The maximum scale level to zoom in for the seats map. Larger value can scale in a lagrer level. Default is `2`.

##### zoomMin
- Type: `Number`(optional)
- Description: The minimum scale level to zoom out for the seats map. Smaller value can scale in a smaller level. Default is `0.5`.

##### width
- Type: `Number` | `String`
- Description: Set the width of the seats map to show. For responsive, set value to `auto`.
- Usage: 
```js
width: 'auto',
// width: 720
```

##### height
- Type: `Number`
- Description: Set the height of the seats map to show. This value **can not** set to `auto`

##### amountMax
- Type: `Number`
- Description: Maximum quantity of seats to book.

#### readOnly
- Type: `Boolean`(optional)
- Description: Setting this option to true can make seats on map unclickable. Default is `False`.

##### limitCategory
- Type: `Object`(optional)
- Description: This property is to limit the booking amount for each cateogry of seats. When setting this property, user can not book any seats when the amount is bigger than the limit.
```jsx
limitCategory: {
  'Free': {
    amountMax: 2
  }, 
  'Normal': {
    amountMax: 3
  },
  'Early Bird': {
    amountMax: 6
}
```

##### disableWheel
- Type: `Boolean`(optional)
- Description: Disable the function of zooming on mouse wheel in seats map. Default is `false`.


## Development

Run `npm run dev` to start the webpack-dev-server on your local device.
Run `npm run build` to bundle a xeats-sdk.js for production.

There are currently four VUE components in the package.
- `user-booking`: This component will show the seats map and seats information for user to book the seat.
- `management`: This component is for managers to choose spots, create seats, change seats status, change seats shape, also to categorize seats.
- `spots-list`: This component is embedded in `management` component, which will get the list of authorized spots for user to change current spots.
- `v-frame`: This component is for embedding other components in an iframe.

### Close iframe for developers to debug

Since embedded components in iframe would cause browser can not display log message in the console and Vue inspection tool. Therefore, you can disable the vframe component manually.

There are two steps to disable the `vframe` component:

1. In `index.js`, each Vue render function has two different createElement. You can find it by search the term `NOTICE: This is for production` and `NOTICE: This is for development`. Comment out the createElement in `product` and uncomment the createElement in `development`.
2. In the components `user-booking.vue` and `management.vue`, you can search the term `vframe` by editor in the `modifiers` object and set it to `false`. This will close the vframe components.

After debugging, remember to comment out development code and uncomment production code in `index.js`, and set `vframe` to `true` in `user-booking.vue` and `management.vue`.



## Change log

* `2017-07-18` Add new feature for Manager to pick multiple keys through Cmd Key
* `2017-06-28` Add new feature to automatically assign sn for seats in management.vue"
* `2017-05-25` Add new argument 'disableWheel' for user to disable zooming on wheel.
* `2017-05-23` Accept array of objects for category property in ManagerMap. Display the legend in UserMap.
* `2017-05-19` Accomplish changing seats shape.
* `2017-05-03` Accomplish APIs with a document of API.(Alpha/Draft)
* `2017-03-24` Accomplish v-pan-zoom.
* `2017-03-21` Finish zoom in out and pick plugins.

## Contributors

[![](https://avatars3.githubusercontent.com/u/665690?v=3&s=60)](https://github.com/andyyou) [![](https://avatars1.githubusercontent.com/u/13399740?v=3&s=60)](https://github.com/PJCHENder)

## Issues

## Road map