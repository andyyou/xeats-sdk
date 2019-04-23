export default {
  install (Vue, options) {
    let pickzone = document.createElement('div')
    pickzone.style.border = '1px dotted #222'
    pickzone.style.position = 'absolute'
    pickzone.style.boxSizing = 'border-box'
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
        let xMin
        let xMax
        let yMin
        let yMax
        let dragging = false

        onRefresh = function () {
          xMin = Math.min(begin.x, moveTo.x)
          xMax = Math.max(begin.x, moveTo.x)
          yMin = Math.min(begin.y, moveTo.y)
          yMax = Math.max(begin.y, moveTo.y)
          pickzone.style.left = (xMin - el.parentNode.getBoundingClientRect().left) + 'px';
          pickzone.style.top = (yMin - el.parentNode.getBoundingClientRect().top) + 'px';
          pickzone.style.width = xMax - xMin + 'px'
          pickzone.style.height = yMax - yMin + 'px'
        }

        onDragStart = function (e) {
          // console.log('onDragStart')
          pickzone.hidden = 0
          dragging = true
          begin.x = e.clientX
          begin.y = e.clientY
          moveTo.x = e.clientX
          moveTo.y = e.clientY
          onRefresh()
        }

        onDragMove = function (e) {
          if (dragging) {
            moveTo.x = e.clientX
            moveTo.y = e.clientY

            onRefresh()
          }
        }

        onDragEnd = function (e) {
          // console.log('onDragEnd')
          pickzone.hidden = 1
          dragging = false
          let point = el.createSVGPoint()
          point.x = xMin || 0
          point.y = yMin || 0
          point = point.matrixTransform(el.getScreenCTM().inverse())
          vnode.context[binding.expression].x = point.x
          vnode.context[binding.expression].y = point.y
          vnode.context[binding.expression].width = xMax - xMin
          vnode.context[binding.expression].height = yMax - yMin
        }

        el.parentNode.appendChild(pickzone)

        el.addEventListener('mousedown', onDragStart)
        el.addEventListener('mousemove', onDragMove)
        pickzone.addEventListener('mousemove', onDragMove)
        if (binding.modifiers.vframe) {
          document.querySelector('#vframe').contentWindow.document.addEventListener('mouseup', onDragEnd)
        } else {
          document.addEventListener('mouseup', onDragEnd)
        }
      },
      unbind (el, binding, vnode, oldVnode) {
        el.removeEventListener('mousedown', onDragStart)
        el.removeEventListener('mousemove', onDragMove)
        if (binding.modifiers.vframe) {
          document.querySelector('#vframe').contentWindow.document.removeEventListener('mouseup', onDragEnd)
        } else {
          document.removeEventListener('mouseup', onDragEnd)
        }
        
        vnode.context[binding.expression].x = 0
        vnode.context[binding.expression].y = 0
        vnode.context[binding.expression].width = 0
        vnode.context[binding.expression].height = 0
        el.parentNode.removeChild(pickzone)
      }
    })
  }
}
