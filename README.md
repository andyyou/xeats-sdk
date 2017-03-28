# SDK 

### Usage

1. HTML 中置放標籤

```
<div id="seat-map"></div>
```

2. 加入 sdk 和 script

```html
<script src="dist/sdk.js"></script>
<script>
  (function () {
    var xeat = new Xeat({
      el: '#seat-map',
      token: 'A226248',
      spot: 'SPACE-ID hash',
      zoomMax: 2,
      zoomMin: 0.5,
      width: 800,
      height: 600,
      autoSize: true,   // Auto scale for Responsive
      amountMax: 4,     // Limit selection amount
      amountMin: 1
    })
  })()
</script>
```


# API

1. 設定活動時取得場地列表資訊

`GET` 

```
[
  {
    id: <guid>,
    name: '台北小巨蛋'
  }
]
```

2. 取得特定場地 座位表 JSON 

Table: Spot

```
{
  id: <guid>,
  name: '台北小巨蛋',
  // svg.width & svg.height 原檔尺寸
  svg: {
    width,
    height
  },
  objects: [ // 座位、舞台、殘障席
    {
      id,
      nodeId,
      row,
      column,
      sn,
      x,
      y,
      type: ['seat', 'stage', 'facility', 'disability']
    }
  ]
}

```

3. 定義 座位、區域

Table: Seat

```
[
  {
    id,
    mapId,
    row,
    column,
    label,
    x,
    y,
    type: ['seat', 'stage', 'facility', 'disability' ],
    zone,
    ticket,
    status,
    fill
    activity
    creator
  }
]
```


# SVG 筆記

* svg 由 W3C 所制定，基於 xml 定義向量圖
* 在 Illustrator 圖層是上蓋下，但在 svg xml 程式中是後蓋前
* 在 svg 中圖層等於 `<g>` 無法控制位置、形狀，單純就是 group 元素
* `<g>` 的 id 等於圖層名稱，在編輯軟體中如果圖層名稱重複則編輯軟體會自動補上 affix

# Todos

* <del>Seat hover show text with information</del>
* <del>Home button (rest map to center)</del>
* Limit drag svg only show map
* Zoom in out for mobile
* <del>Plus button (zoom in)</del>
* <del>Minus button (zoom out)</del>
* Event and append elements for after selectd seat call API
* Get seat map and data from API
* <del>Click to select seats</del>
* <del>Limit selection quanity</del>
* <del>Zoom in out</del>

# Changelog

* `2017-03-21` 完成基本 zoom in out 與 選票功能
