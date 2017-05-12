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

        // Vue instance
        return new Vue({
          el: options.el,
          data: {
            fields: []
          },
          methods: {
            generateFormFields (data) {
              this.fields = data
            }
          },
          render (createElement) {
            return createElement('div', {
              style: {
                height: '100%'
              }
            }, [
              this.fields.map(function (field) {
                /**
                 * field should has properties:
                 * * type
                 * * row
                 * * column
                 * * _id
                 * * node_id
                 * * label
                 */
                return createElement('input', {
                  attrs: {
                    value: field.node_id,
                    id: field._id,
                    type: 'hidden',
                    name: 'xeats[]',
                    'data-type': field.type,
                    'data-row': field.row,
                    'data-column': field.column,
                    'data-label': field.label
                  }
                })
              }),
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
                    categories: options.component.data && options.component.data.categories,
                    /**
                     * When use vframe 
                     * Please make sure your component need to place data
                     * outside of iframe for form-post.
                     */
                    generateFormFields: this.generateFormFields
                  },
                })
              ])
            ])
            
            /**
             * Wrap in iframe will cause console has nothing.
             * The snippet as follow provide for dev.
             * 
             * NOTE: v-pan-zoom, v-picking will have modifier when use vframe
             * e.g. v-pan-zoom.vframe
             */
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