import Vue from 'vue'
import axios from 'axios'
import VuePanZoom from '@/plugins/vue-svg-pan-zoom'
import VuePicking from '@/plugins/vue-picking'
import '@/stylesheets/sdk'
axios.defaults.baseURL = 'https://xeats.herokuapp.com/v1.0'
Vue.prototype.$http = axios

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame
window.requestAnimationFrame = requestAnimationFrame
Vue.use(VuePanZoom)
Vue.use(VuePicking)

function setToken (accessKey, secret) {
  axios.post('/users/token', {
    access_key: accessKey,
    secret: secret
  }).then(function (res) {
    localStorage.setItem('_x_t', res.data.token)
  }).catch(function (err) {
    console.log(err)
  })
}

/**
 * SDK Main Class
 */
class Xeat {
  constructor (options) {
    const componentNames = ['reversation', 'setup']

    if (!options.el && !/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g.test(options.el)) {
      throw new Error('el attribute has no setting')
    }
    
    // Initialize token
    setToken(options.accessKey, options.secret)

    if (options.component && options.component.name && componentNames.indexOf(options.component.name)) {
      const app = require(`@/components/${options.component.name}`)
      return new Vue({
        el: options.el,
        methods: {
          setToken () {
            setToken(options.accessKey, options.secret)
          },
          getToken () {
            return localStorage.getItem('_x_t')
          }
        },
        render (createElement) {
          return createElement('app', {
            props: {
              width: options.width,
              height: options.height,
              sourceId: options.component.sourceId,
              zoomMax: options.zoomMax,
              zoomMin: options.zoomMin,
              amountMax: options.amountMax,
              amountMin: options.amountMin,
              categories: options.component.data.categories
            }
          })
        },
        components: {
          app
        }
      })
    } else {
      throw new Error('Specific invalid Xeat component type')
    }
  }
}

window.Xeat = Xeat
export default Xeat