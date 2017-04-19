export default {
  install (Vue, options) {
    let pickzone = document.createElement('div')
    pickzone.style.border = '1px dotted #222'
    pickzone.style.position = 'absolute'
    pickzone.hidden = 1

    let begin = {
      x: 0,
      y: 0
    }

    let moveTo = {
      x: 0,
      y: 0
    }

    let onRefresh, onDragStart, onDragMove, onDragEnd

    Vue.directive('picking', {
      bind (el, binding, vnode, oldVnode) {
        let xMin, xMax, yMin, yMax
        onRefresh = function () {
          xMin = Math.min(begin.x, moveTo.x)
          xMax = Math.max(begin.x, moveTo.x)
          yMin = Math.min(begin.y, moveTo.y)
          yMax = Math.max(begin.y, moveTo.y)
          pickzone.style.left = (xMin - el.parentElement.getBoundingClientRect().left) + 'px';
          pickzone.style.top = (yMin - el.parentElement.getBoundingClientRect().top) + 'px';
          pickzone.style.width = xMax - xMin + 'px';
          pickzone.style.height = yMax - yMin + 'px';
        }

        onDragStart = function (e) {
          pickzone.hidden = 0
          begin.x = e.clientX
          begin.y = e.clientY

          onRefresh()
        }

        onDragMove = function (e) {
          moveTo.x = e.clientX
          moveTo.y = e.clientY

          onRefresh()
        }

        onDragEnd = function (e) {
          pickzone.hidden = 1
          let point = el.createSVGPoint()
          point.x = xMin
          point.y = yMin
          point = point.matrixTransform(el.getScreenCTM().inverse())
          vnode.context[binding.expression].x = point.x
          vnode.context[binding.expression].y = point.y
          vnode.context[binding.expression].width = xMax - xMin
          vnode.context[binding.expression].height = yMax - yMin
        }

        el.parentElement.appendChild(pickzone)

        el.addEventListener('mousedown', onDragStart)
        el.addEventListener('mousemove', onDragMove)
        document.addEventListener('mouseup', onDragEnd)        
      },
      unbind (el, binding, vnode, oldVnode) {
        el.removeEventListener('mousedown', onDragStart)
        el.removeEventListener('mousemove', onDragMove)
        document.removeEventListener('mouseup', onDragEnd)
        vnode.context[binding.expression].x = 0
        vnode.context[binding.expression].y = 0
        vnode.context[binding.expression].width = 0
        vnode.context[binding.expression].height = 0
        el.parentElement.removeChild(pickzone)
      }
    })
  }
}