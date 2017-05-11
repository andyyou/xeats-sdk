import Vue from 'vue'
import axios from 'axios'
import VuePanZoom from '@/plugins/vue-svg-pan-zoom'
import VuePicking from '@/plugins/vue-picking'
import '@/stylesheets/sdk'
axios.defaults.baseURL = 'https://xeats.io/v1.0'
Vue.prototype.$http = axios

Vue.use(VuePanZoom)
Vue.use(VuePicking)

/**
 * SDK Main Class
 */
class Xeat {
  constructor (options) {
    const componentNames = ['management', 'user-booking']

    if (!options.el && !/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g.test(options.el)) {
      throw new Error('el attribute has no setting')
    }

    if (options.component && options.component.name && componentNames.indexOf(options.component.name) !== -1) {
      const app = require(`@/components/${options.component.name}`)
      const vframe = require(`@/components/vframe`)

      // TODO: 2017-05-11 If user-booking no need to get token
      axios.post('/users/token', {
        access_key: options.accessKey,
        secret: options.secret
      })
      .then(function (res) {
        localStorage.setItem('_x_t', res.data.token)
        return res.data.token
      })
      .then(function (token) {
        return new Vue({
          el: options.el,
          render (createElement) {
            return createElement('div', [
              createElement('vframe', {
                props: {
                  width: options.width,
                  height: options.height
                }
              }, [
                createElement('app', {
                  props: {
                    width: options.width,
                    height: options.height,
                    seatsKey: options.component.seatsKey,
                    zoomMax: options.zoomMax,
                    zoomMin: options.zoomMin,
                    amountMax: options.amountMax,
                    amountMin: options.amountMin,
                    categories: options.component.data && options.component.data.categories
                  }
                })
              ])
            ])
             
            // return createElement('app', {
            //   props: {
            //     width: options.width,
            //     height: options.height,
            //     seatsKey: options.component.seatsKey,
            //     zoomMax: options.zoomMax,
            //     zoomMin: options.zoomMin,
            //     amountMax: options.amountMax,
            //     amountMin: options.amountMin,
            //     categories: options.component.data && options.component.data.categories
            //   }
            // })
          },
          components: {
            app,
            vframe
          }
        })
      })
      .catch(function (err) {
        console.log(err)
      })
    } else {
      throw new Error('Specific invalid Xeat component type')
    }
  }
}

export default Xeat