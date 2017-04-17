import Vue from 'vue'
import axios from 'axios'
import VuePanZoom from '@/plugins/vue-svg-pan-zoom'
import '@/stylesheets/sdk'
axios.defaults.baseURL = 'https://xeats.herokuapp.com/v1.0'
Vue.prototype.$http = axios

var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                            window.webkitRequestAnimationFrame || window.msRequestAnimationFrame
window.requestAnimationFrame = requestAnimationFrame
Vue.use(VuePanZoom)

/**
 * SDK Main Class
 */
class Xeat {
  constructor (options) {
    const componentNames = ['reversation', 'setup']

    if (!options.el && !/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g.test(options.el)) {
      throw new Error('el attribute has no setting')
    }

    if (options.component && options.component.name && componentNames.indexOf(options.component.name)) {
      const app = require(`@/components/${options.component.name}`)
      return new Vue({
        el: options.el,
        data: {
          token: null
        },
        methods: {
          setToken () {
            this.$http.post('/users/token', {
              access_key: options.accessKey,
              secret: options.secret
            }).then(function (res) {
              localStorage.setItem('_x_t', res.data.token)
            })
          }
        },
        render (createElement) {
          this.setToken()
          return createElement('app', {
            props: {
              width: options.width,
              height: options.height,
              sourceId: options.component.sourceId,
              zoomMax: options.zoomMax,
              zoomMin: options.zoomMin,
              autoSize: options.autoSize,
              amountMax: options.amountMax,
              amountMin: options.amountMin
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