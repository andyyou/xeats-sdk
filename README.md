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

`GET` /spots

```
[
  {
    id: ObjectId,
    name: String
  }
]
```

2. 取得特定場地 座位表

`GET` /spots/:id

Table: Spot

```
{
  // 場地 Id
  id: ObjectId,
  // 場地名稱 e.g. 台北小巨蛋
  name: String, 
  // 原檔尺寸，計算 viewport 縮放使用
  svg: {
    width,
    height
  },
  // API 取值使用
  hash: String
  // 場地設施，物件 e.g. 座位、舞台、殘障席
  objects: [ 
    {
      // 物件 Id
      id: String,
      // svg 元素 Id
      node_id: String,
      // 排
      row: Number,
      // 位
      column: Number,
      // 文字標記 e.g 4排5號
      label: String,
      // svg x 座標
      x: Number,
      // svg y 座標
      y: Number,
      // svg 物件寬
      width: Number,
      // svg 物件高
      height: Number,
      // 物件類型: 座位、舞台、其他設施、殘障席
      // Enum: seat, stage, facility, disability
      type: String,
      // 建立時間
      created_at: Date
      // 更新時間
      updated_at: Date
    },
    // 權限 ['User #1 Id', 'User #2 Id']
    // 預設把建立者的 Id 加入，空陣列任何人都不能 get
    rank: Array
    // 建立者 ID
    user: User
    // 建立時間
    created_at: Date
    // 更新時間
    updated_at: Date
  ]
}
```

3. 建立 活動座位、區域（座位綁定活動）

> 實際訂位購票 修改的資料

`GET` /seats
`POST` /seats
`PUT` /seats/:id
`PUT` /seats/:id/:seat_id

Table: Seat

```
{
  // 單場訂位活動名稱 e.g. 張學友演唱會
  name: String,
  // 場地名稱 copy from spot
  spot_name: String,
  objects: [
    {
      id: ObjectId
      // 給 API 使用者註記誰取得票價的 hash
      sn: String,
      // 排
      row: Number,
      // 位/號
      column: Number,
      // 文字標記 e.g 4排5號
      label: String,
      // svg x 座標
      x: Number,
      // svg y 座標
      y: Number,
      // 物件類型: 座位、舞台、其他設施、殘障席
      // Enum: seat, stage, facility, disability
      type: String,
      // 座位狀態 :available, :reserved
      status: Number,
      // svg 顏色
      fill: String,
      // svg 形狀寬
      width: Number,
      // svg 形狀高
      height: Number,
      // 鎖，表示該座位不可更新
      lock: Boolean,
      // 備註
      comment: String,
      // 區
      zone: String,
      // 給 API 使用者註記 訂單／訂購者等資訊欄位
      info: Object || Mixed
    }
  ],
  spot: Spot,
  user: User,
  created_at: Date,
  updated_at: Date
}
```


# SVG 筆記

* svg 由 W3C 所制定，基於 xml 定義向量圖
* 在 Illustrator 圖層是上蓋下，但在 svg xml 程式中是後蓋前
* 在 svg 中圖層等於 `<g>` 無法控制位置、形狀，單純就是 group 元素
* `<g>` 的 id 等於圖層名稱，在編輯軟體中如果圖層名稱重複則編輯軟體會自動補上 affix

# Todos

* [x] Seat hover show text with information
* [x] Home button (rest map to center)
* [ ] Limit drag svg only show map
* [ ] Zoom in out for mobile
* [x] Plus button (zoom in)
* [x] Minus button (zoom out)
* [ ] Event and append elements for after selectd seat call API
* [ ] Get seat map and data from API
* [x] Click to select seats
* [x] Limit selection quanity
* [x] Zoom in out
* [x] Remove `autoSize`

# Changelog

* `2017-03-24` 根據 API 修改文件與 v-pan-zoom 變數名稱
* `2017-03-21` 完成基本 zoom in out 與 選票功能
