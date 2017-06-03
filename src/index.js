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
 * SDK ManagerMap Class
 */
class ManagerMap {
  constructor (options) {
    // const componentNames = ['management', 'user-booking']

    if (!options.el && !/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g.test(options.el)) {
      throw new Error('el attribute has no setting')
    }

    const app = require(`@/components/management`)
    const vframe = require(`@/components/vframe`)

    axios.post('/users/token', {
      access_key: options.accessKey,
      secret: options.secret
    })
    .then(res => {
      localStorage.setItem('_x_t', res.data.token)
      return res.data.token
    })
    .then(token => {
      // Vue instance
      return new Vue({
        el: options.el,
        data: {
          fields: []
        },
        methods: {
          generateFormFields (data) {
            this.fields = data
          },
          onAfterSave (data) {
            if (options.onAfterSave instanceof Function) {
              options.onAfterSave(data)
            }
          }
        },

        render (createElement) {
          // NOTICE: This is for production
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
                  seatsKey: options.seatsKey,
                  zoomMax: options.zoomMax,
                  zoomMin: options.zoomMin,
                  amountMax: options.amountMax,
                  amountMin: options.amountMin,
                  categories: options.categories,
                  disableWheel: options.disableWheel,
                  /**
                   * When use vframe
                   * Please make sure your component need to place data
                   * outside of iframe for form-post.
                   */
                  generateFormFields: options.generateFormFields,
                  onAfterSave: options.onAfterSave
                }
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
          //     seatsKey: options.seatsKey,
          //     zoomMax: options.zoomMax,
          //     zoomMin: options.zoomMin,
          //     amountMax: options.amountMax,
          //     amountMin: options.amountMin,
          //     disableWheel: options.disableWheel,
          //     categories: options.categories
          //   }
          // })
          /* /development */
        },
        components: {
          app,
          vframe
        }
      })
    })
    .catch(err => {
      console.error(err)
    })
  }
}

class UserMap {
  constructor (options) {
    if (!options.el && !/([^\r\n,{}]+)(,(?=[^}]*{)|\s*{)/g.test(options.el)) {
      throw new Error('el attribute has no setting')
    }

    const app = require(`@/components/user-booking`)
    const vframe = require(`@/components/vframe`)
    return new Vue({
      el: options.el,
      data: {
        fields: []
      },
      methods: {
        generateFormFields (data) {
          if (options.onPick instanceof Function) {
            options.onPick(data)
          } else {
            this.fields = data
          }
        }
      },
      render (createElement) {
        // NOTICE: render element in iframe
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
                seatsKey: options.seatsKey,
                accessKey: options.accessKey,
                disableWheel: options.disableWheel,
                zoomMax: options.zoomMax,
                zoomMin: options.zoomMin,
                amountMax: options.amountMax,
                amountMin: options.amountMin,
                /**
                 * When use vframe
                 * Please make sure your component need to place data
                 * outside of iframe for form-post.
                 */
                generateFormFields: options.generateFormFields,
                /**
                 * For limiting the booking time for each seat category
                 */
                limitCategory: options.limitCategory,
                /**
                 * disable the time limit of limitCategory (this is for preoccupying seats)
                 */
                disableDatetimeLimit: options.disableDatetimeLimit
              }
            })
          ])
        ]) /* /production */

        // NOTICE: This is for develope
        // return createElement('app', {
        //   props: {
        //     width: options.width,
        //     height: options.height,
        //     seatsKey: options.seatsKey,
        //     accessKey: options.accessKey,
        //     zoomMax: options.zoomMax,
        //     zoomMin: options.zoomMin,
        //     amountMax: options.amountMax,
        //     amountMin: options.amountMin,
        //     limitCategory: options.limitCategory,
        //     disableDatetimeLimit: options.disableDatetimeLimit,
        //     disableWheel: options.disableWheel,
        //     generateFormFields: options.generateFormFields
        //   }
        // })
        /* /develope */
      },
      components: {
        app,
        vframe
      }
    })
  }
}

export default { ManagerMap, UserMap }
export { ManagerMap, UserMap }
