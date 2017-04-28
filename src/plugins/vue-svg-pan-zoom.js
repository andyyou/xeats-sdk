import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/fromEvent'
import 'rxjs/add/observable/empty'
import 'rxjs/add/observable/merge'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/switch'
import 'rxjs/add/operator/observeOn'
import 'rxjs/add/operator/takeUntil'
import { animationFrame } from 'rxjs/scheduler/animationFrame'

import Hammer from 'hammerjs'
import hammertime from 'hammer-timejs'

export default {
  install (Vue, options) {
    /**
     * elements of svg moving ability
     */
    
    let subDrag, subZoom

    Vue.directive('pan-zoom', {
      bind (el, binding, vnode, oldVnode) {
        /**
         * Draggable svg
         */
        const mousedown = Observable.fromEvent(el, 'mousedown')
        const mousemove = Observable.fromEvent(el, 'mousemove')
        const mouseup = Observable.fromEvent(document, 'mouseup')

        const touchstart = Observable.fromEvent(el, 'touchstart')
        const touchmove = Observable.fromEvent(el, 'touchmove')
        const touchcancel = Observable.fromEvent(el, 'touchcancel')
        const touchend = Observable.fromEvent(document, 'touchend')

        const dragStart = Observable.merge(mousedown, touchstart)
        const dragMove = Observable.merge(mousemove, touchmove)
        const dragEnd = Observable.merge(mouseup, touchcancel, touchend)

        let svg = el

        const drag = dragStart.map((e) => {
          e.preventDefault()
          e.stopPropagation()

          // If click on elements in svg do NOT handle
          if (e.currentTarget.tagName !== 'svg') {
            return Observable.empty()
          }

          // Only handle one touch
          if (e.touches && e.touches.length > 1) {
            return Observable.empty()
          }

          /**
           * Current Transformation Matrix
           *
           * http://stackoverflow.com/questions/10298658/mouse-position-inside-autoscaled-svg
           */

          let startPoint = svg.createSVGPoint()
          let ctm = svg.getScreenCTM()
          const prevPoint = {
            x: vnode.context[binding.expression].x,
            y: vnode.context[binding.expression].y
          }

          // Mouse point of browser window
          if (e.touches) {
            startPoint.x = e.touches[0].clientX
            startPoint.y = e.touches[0].clientY
          } else {
            startPoint.x = e.clientX
            startPoint.y = e.clientY
          }

          startPoint = startPoint.matrixTransform(ctm.inverse())

          return dragMove.observeOn(animationFrame).map((e) => {
            let moveToPoint = svg.createSVGPoint()

            if (e.touches) {
              moveToPoint.x = e.changedTouches[0].clientX
              moveToPoint.y = e.changedTouches[0].clientY
            } else {
              moveToPoint.x = e.clientX
              moveToPoint.y = e.clientY
            }
            moveToPoint = moveToPoint.matrixTransform(ctm.inverse())

            return {
              x: prevPoint.x + (startPoint.x - moveToPoint.x),
              y: prevPoint.y + (startPoint.y - moveToPoint.y)
            }
          }).takeUntil(dragEnd)
        }).switch()

        subDrag = drag.subscribe((p) => {
          vnode.context[binding.expression].x = p.x
          vnode.context[binding.expression].y = p.y
        })

        /**
         * Zoom in out
         */
        const wheel = 'onwheel' in document ? 'wheel' : 'mousewheel'
        const zoom = Observable.fromEvent(el, wheel)

        subZoom = zoom.subscribe((e) => {
          e.preventDefault()
          e.stopPropagation()
          requestAnimationFrame(() => {
            let viewport = {
              width: svg.getBoundingClientRect().width,
              height: svg.getBoundingClientRect().height
            }
            let scale = vnode.context[binding.expression].scale
            let tmp = scale + (e.deltaY / 100)
            if (tmp >= vnode.context[binding.expression].zoomMax * vnode.context[binding.expression].initialScale) {
              tmp = vnode.context[binding.expression].zoomMax * vnode.context[binding.expression].initialScale
            }
            if (tmp <= vnode.context[binding.expression].zoomMin * vnode.context[binding.expression].initialScale) {
              tmp = vnode.context[binding.expression].zoomMin * vnode.context[binding.expression].initialScale
            }
            scale = tmp
            vnode.context[binding.expression].scale = scale

            // Mouse or touch point
            let offsetPoint = svg.createSVGPoint()
            let ctm = svg.getScreenCTM()

            if (e.touches && e.touches.length > 1) {
              offsetPoint.x = e.changedTouches[0].clientX
              offsetPoint.y = e.changedTouches[0].clientY
            } else {
              offsetPoint.x = e.clientX
              offsetPoint.y = e.clientY
            }

            // Get svgOffsetPoint position，mouse or touch point relative to origin point of SVG
            let svgOffsetPoint = offsetPoint.matrixTransform(ctm.inverse())
            svg.setAttribute('viewBox', `${vnode.context[binding.expression].x} ${vnode.context[binding.expression].y} ${viewport.width * scale} ${viewport.height * scale}`)
            vnode.context[binding.expression].width = viewport.width * scale
            vnode.context[binding.expression].height = viewport.height * scale

            /**
             * svgScaledPoint: The same point but different unit
             * mains will get scaled unit in svg
             */
            let svgScaledPoint = offsetPoint.matrixTransform(svg.getScreenCTM().inverse())
            let viewBox = svg.getAttribute('viewBox').split(' ').map(n => parseFloat(n))
            let movement = {
              x: viewBox[0] + (svgOffsetPoint.x - svgScaledPoint.x),
              y: viewBox[1] + (svgOffsetPoint.y - svgScaledPoint.y)
            }
            svg.setAttribute('viewBox', `${movement.x} ${movement.y} ${viewport.width * scale} ${viewport.height * scale}`)

            vnode.context[binding.expression].x = movement.x
            vnode.context[binding.expression].y = movement.y
          })
        })

        /**
         * TODO: touch for Zoom in out
         */
      },
      unbind () {
        subDrag.unsubscribe()
        subZoom.unsubscribe()
      }
    })
  }
}
