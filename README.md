# SDK

# API

1. 設定活動時取得場地列表資訊

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
  // svg.width & svg.height
  viewport: {
    width,
    height
  }
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

* seat hover show text
* rest map to center
* click to select seats
* limit drag svg only show map
* zoom in out