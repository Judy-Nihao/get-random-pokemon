# 寶可夢隨機卡片生成器 Get A Random Pokemon Card

## 實作網址
gh-pages
https://judy-nihao.github.io/get-random-pokemon

GitHub Repo
https://github.com/Judy-Nihao/get-random-pokemon

## 實現功能
- 點擊寶貝球隨機產生一隻寶可夢
- 卡片背景色隨寶可夢屬性變化
- 點擊卡片會翻轉並顯示寶可夢小敘述與小動圖
- 點擊下載按鈕可以下載寶可夢卡片

## 實作紀錄： Get A Random Pokemon Card
寶可夢是小時候的回憶(以前的翻譯是神奇寶貝)，搜尋開放 API 時發現原來有 [PokéAPI](https://pokeapi.co/) 可以使用真是太帥了，參考幾種教學分享，最後使用 2 種 API，結合另 1 份寶可夢中文翻譯 JSON 檔，擷取寶可夢英文名稱、大張圖像、中文名稱、中文敘述與 GIF 小動圖等資料，試著做出可以隨機渲染一隻寶可夢，並且可以點擊下載卡片收藏的寶可夢卡片產生器。

![image](https://hackmd.io/_uploads/BJxrOrQLh.png)
![image](https://hackmd.io/_uploads/rJtS_BmU2.png)
![image](https://hackmd.io/_uploads/SyjoOSm82.png)


## API 結構

API 官網 [The RESTful Pokémon API](https://pokeapi.co/)

Base URL：https://pokeapi.co/api/v2

Base URL 後面添加不同後綴可以取得不同類型的資料，API 官網上面也能測試。

- 取得寶可夢基本資料：https://pokeapi.co/api/v2/pokemon/{id}
- 取得寶可夢中文敘述：https://pokeapi.co/api/v2/pokemon-species/{id}

{id} 要替換為純數字，每隻寶可夢都有固定的 id ，1 號是妙蛙種子，25 號是皮卡丘等等。

隨機產生寶可夢的重點在於隨機產生一個正整數，將正整數帶入當作 id。

寶可夢大約有超過一千隻，但是測試發現，數字隨機範圍越大，似乎呼叫 API 時會比較慢，所以實作裡面是抓 300隻。

##  隨機產生整數 Math.floor 和 Math.random()

運用 `Math.floor()` 和 `Math.random()` 兩種函式產生介於 1~300 之間的隨機整數，作為寶可夢 id。

> [MDN Math.floor()](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Math/floor)
> [MDN Math.random()](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Math/random)

```javascript!
let id = Math.floor(Math.random() * 300) + 1;
    
const url = "https://pokeapi.co/api/v2/pokemon/"
const quoteUrl = "https://pokeapi.co/api/v2/pokemon-species/"

const finalUrl = url + id;
const finalQuoteUrl = quoteUrl + id;

```
`Math.random() * 300` 意思是會從 0~300之間隨機產生浮點數，範圍包含 0 但不包含 300。
`Math.floor` 則是會回傳「小於等於」所給數字的最大整數。

也就是說，

若隨機取得的浮點數是 0.00001，小於等於後的最接近整數是 0。
若隨機取得的浮點數是 299.999，小於等於後的最接近整數是 299。

但注意回傳得到的隨機數字必須要 + 1 ，因為寶可夢 id 是從 1 號開始編號不是 0 號。

```
0 + 1 = 1
299 + 1 = 300
```

## 3支資料的取得順序

總共有 3 種資料要處理：
1. 寶可夢英文基本資料：英文名稱+hp值+屬性+攻擊力+防禦力+速度
2. 寶可夢中文名稱
3. 寶可夢中文的描述

中文名稱資料來源：[sindresorhus/pokemon/data/zh-hant.json](https://github.com/sindresorhus/pokemon/blob/main/data/zh-hant.json)


由於資料分別來自 3 個不同來源，使用 3 段 axios 去呼叫，程式碼的撰寫順序會影響到資料抓取的順序，以及渲染在畫面上的順序。

所有的資料呼叫都被包在 `getPokeData()` 裡面，只要 DOM 載入好就執行 `getPokeData` 。


```javascript!
window.addEventListener("load", getPokeData);
```

```javascript!
function getPokeData(){
    let id = Math.floor(Math.random() * 300) + 1;
    const finalUrl = url + id;
    const finalQuoteUrl = quoteUrl + id;
 
    //========= 01 取得寶可夢英文資料 =========
    axios
    .get(finalUrl)
    .then((res) => {
        const pokemonData = res.data;
        generateCard(pokemonData, id);    
        })
    .catch((err) => {
        console.log(err);
    });

    // ========= 03 取得「同一隻 id 」寶可夢中文敘述 =========
    axios
    .get(finalQuoteUrl)
    .then((res) => {
        const quote = res.data;
        getQuote(quote);
    })
    .catch((err) => {
        console.log(err);
    });
}
```

```javascript!
// 渲染寶可夢卡片
function generateCard(data,id){
    // ... (略過)前面一大段都是關於渲染寶可夢英文資訊
   
   // 02 取得「同一隻」寶可夢「中文名稱」 
   axios
   .get("js/zh-hant.json")
   .then((res) => {
       nameTC = res.data;
       createChinese(nameTC);
   })
   .catch((err) => {
       console.log(err);
   });
}

```

先取得「01 寶可夢英文基本資料」，取得後進行`generateCard()`，在`generateCard()`裡面接續去取得「02 寶可夢中文名稱」。

之所以「02 取得中文名稱」要被包在「01 取得英文資訊」裡面進行，是因為英文資料要去外部叫，中文名單 JSON 檔則是在本地端，中文會比較快出現。


順序上是要先用「01英文資訊」渲染出卡片本體，抓取當前 DOM 畫面上的寶可夢 id ，再去中文名稱陣列中比對出同樣 id 的寶可夢中文。

如果不控制執行順序，讓兩者同時針對同一個 id 發出請求，資料的速度差會導致卡片還沒渲染在 DOM 上面，就想把中文填入卡片，DOM 上面找不到要填入的卡片元素，就會出錯。

這邊控制順序的方式是，先用「01 取得英文資訊」渲染出 HTML ，在 HTML 上面自訂一個 `data-pokemonId="${id}"` 屬性，再發出「02 取得中文名稱」呼叫並進行 `createChinese()`，此時抓 id 是去抓已經渲染在 DOM 上面的 `data-pokemonId="${id}"` 的值，這樣可以確保比對出來的中文名稱一定是畫面上的同一隻。


## 中文清單索引值 與 id 編號的比對 
要注意的是，中文名單陣列索引值是從 0 開始，但寶可夢 id 是從 1號開始。

也就是說，妙蛙種子的索引值會是 0 ，妙蛙種子的 data-pokemonId 是 1，

所以，去比對取得中文名稱的陣列時，索引值要記得 `id-1` 才抓得到正確對象名稱。

![image](https://hackmd.io/_uploads/H1Gcz_X8n.jpg)


```javascript!
function createChinese(names){
    // 在畫面上創造 h2 元素並給class
    let pokeNameTC = document.createElement("H2")
    pokeNameTC.className = "pokeNameTC";
    
    // 抓取 DOM 上面的寶可夢 data-pokemonId
    let pokeNameEN = document.querySelector(".poke-name");
    let nameID = pokeNameEN.getAttribute("data-pokemonId");
    
    // 寶可夢 id -1 才是正確的同一隻寶可夢中文清單索引值
    let name = names[nameID-1];
    
    pokeNameTC.textContent = name;
    
    // 把寶可夢中文添加在寶可夢英文後面
    pokeNameEN.after(pokeNameTC);
}
```

## 卡片渲染的細節：如果遇到不確定數量的資料

比較以下兩隻寶可夢卡片，會發現，有些只有1種屬性，有些卻有2種屬性。

因為屬性數量不一定，在渲染卡片的 HTML 結構時，要把屬性 type 的資料單獨拉出來跑`forEach`，用 `createElement()` 方法，產生新的 `span` 元素，有多少屬性就產生多少個 span ，之後才把產生出來的 span 加進 `card.innerHTML`。

![image](https://hackmd.io/_uploads/rkoo2w7Uh.jpg)


在 `generateCard()` 裡面執行 `appendTypes(data.types)`

```javascript!
// 渲染寶可夢卡片
function generateCard(data,id){
    
    // (略過）前面一大串是外部抓取的資料存進變數中
    
    card.innerHTML = `..(很長一串 HTML ）...`
    
    //屬性數量不一定，另外拉出去處理完再加回來
    appendTypes(data.types);

}

```


```javascript!

// 必須先有 card.innerHTML ，選擇器才找得到 class="types" 元素
// 產生的 span 再加進去 html 序列內

function appendTypes(types){
    types.forEach( item => {
        let span = document.createElement("SPAN");
        span.textContent = item.type.name;
        document.querySelector(".types").appendChild(span);
    })
};

```


![image](https://hackmd.io/_uploads/rJ7SxumI3.png)
![image](https://hackmd.io/_uploads/ByUYzOmUh.jpg)

## 渲染寶可夢中文敘述

卡片背面的寶可夢中文是第 3 支 api 的資料，舉例來說，若想抓到皮卡丘的「中文」敘述，

請求網址是：https://pokeapi.co/api/v2/pokemon-species/25

裡面有一項屬性叫做：flavor_text

```json!
{
"flavor_text": "最近發表了聚集大量皮卡丘\n來建造發電廠的計畫。",
"language": {
"name": "zh-Hant",
"url": "https://pokeapi.co/api/v2/language/4/"
},
"version": {
"name": "sun",
"url": "https://pokeapi.co/api/v2/version/27/"
}
},
```

### 尋找含有特定屬性的物件，是相對於陣列中的第幾個

整體回傳資料很長，用瀏覽器檢查資料時，可以用「尋找文字」輸入「zh-hant」關鍵字找到那個屬性，但如果要把屬性的值抓出來賦予到變數中，我必須知道包含有這個屬性的物件，是陣列中的「第幾個」物件，才能順利取值。

結合使用 2 個陣列方法：

#### array.map()
#### array.indexOf()

- `map()` 方法會建立一個新的陣列，其內容為原陣列的每一個元素，經由回呼函式運算後，所回傳的結果之集合。

- `indexOf()` 方法會回傳給定元素於陣列中第一個被找到之「索引」，若不存在於陣列中則回傳 -1。


首先用`map()`對整體陣列進行篩選，map 括號內放一個 function 作為篩選步驟，篩選條件是，把每個物件內的，language屬性的name屬性的值，抽出來，return 組出一個新陣列。

這個新陣列內容可能會長成這樣子：`["en", "fr", "de", …"zh-Hant",…]`

再用 indexOf()方法，去新陣列中找出`"zh-Hant"` 是在這個新陣列中的索引第幾？

最後把`indexOf()`回傳的索引數值，存進變數 result 中，

假如印出 result 檢查發現是索引56，就回頭把 56 帶入最一開始的陣列，變成 `entryArr[56]`，這樣就能從多種語言的寶可夢敘述中，取得中文版的敘述。


```javascript!
//取得同一隻寶可夢敘述
function getQuote(quote){
    let entryArr = quote.flavor_text_entries;

    //找到中文的敘述是在索引值第幾個
    let result = entryArr.map(function(item, index) {
        return item.language.name;
    }).indexOf("zh-Hant");
    
    //把索引值帶入原始陣列
    let entryText = entryArr[result].flavor_text;

    card.setAttribute("data-entryText", entryText);
}

```

### 遇到資料有缺的狀況

然而，有些寶可夢的 flavor_text 是空的陣列 []，

或是雖然有其他語言的 flavor_text，但是缺少中文(zh-hant)的。

- id 編號 999 號的寶可夢就沒有flavor_text
- id 編號 243 號的雷公則是缺少中文的flavor_text

https://pokeapi.co/api/v2/pokemon-species/999
https://pokeapi.co/api/v2/pokemon-species/243

![image](https://hackmd.io/_uploads/SyTtEu7In.png)

如果沒有明確指定「缺少中文敘述」的那張寶可夢卡片，背後要顯示什麼，卡片背後在渲染時有時候會抓到前一個的敘述，導致敘述跟寶可夢搭配錯誤。

#### 進行索引值狀態的判斷

前面步驟寫的`let entryText = entryArr[result].flavor_text` 必須增添一點 if else 的判斷。

- 如果資料有缺是空陣列， map() 篩選後新陣列是空陣列， indexOf() 回傳結果就會是 -1
- 如果資料不是空陣列，但是剛好沒有 zh-hant 的敘述，indexOf() 找不到相符的關鍵字，一樣會回傳 -1 。

if 判斷條件，若 `result == -1`，一律把寶可夢敘述填寫成「關於這隻寶可夢還有許多未知」，否則，若一切正常，就去抓取中文敘述。


```javascript
 if(result == -1){
        entryText = "關於這隻寶可夢還有許多未知"
    }else{
        entryText = entryArr[result].flavor_text;
    }

    card.setAttribute("data-entryText", entryText);
```

![image](https://hackmd.io/_uploads/BkdfytmLn.jpg)


#### 把中文敘述渲染到 HTML 上

最後一行的 `card.setAttribute("data-entryText", entryText)` 意思是把中文敘述用渲染到 HTML 客製化的 `data-` 屬性上。

![image](https://hackmd.io/_uploads/BJHWnOmIn.png)

會這樣做也是因為 api 抓取資料的回傳有時間差，導致有時候卡片翻面時中文敘述渲染抓到的是不同id 的寶可夢敘述。

反覆測試後，我是設計成點擊卡片後，才去抓取 HTML 上的 `data-entryText` 的資料，並顯示在卡片背後的 p 元素內。

```javascript!
// 卡片點擊後翻面，把寶可夢敘述 Entry Text 顯示在背面

card.addEventListener("click", ()=>{
    card.classList.toggle("active");
    let pokeEntry = document.querySelector(".poke-entry");
    let pokeEntryText = pokeEntry.querySelector("p");
    pokeEntryText.textContent = card.getAttribute("data-entryText");
    pokeEntry.classList.toggle("active");

    console.log(card);
    console.log(card.firstElementChild);
})
```

![image](https://hackmd.io/_uploads/SkxsTdQLh.gif)


## 下載卡片 html2canvas 套件

下載網頁上指定元素區域的畫面，使用 html2canvas 這個套件，並用 CDN 引入 。

> html2canvas的主要功能是將前端頁面中的HTML按照一定規則繪製在Canvas中，之後我們可以對Canvas進行讀取和導出，從而達到類似於截圖的效果。

實際操作圖片下載時遇到2個狀況：
1. 寶可夢的圖片明明畫面上看得到，下載下來卻是空白的
2. 偽元素 content="" 裡面的文字下載後順序會亂掉

```htmlembedded!
 <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js" defer></script>
```



### 1. 下載後圖片空白的問題
爬文發現是因為寶可夢的圖片是跨網域（crossorigin）存取，不是從本地端的資料夾去抓的，所以會有問題。

html2canvas 函式內，必須要加上2個屬性：

- `allowTaint:false` ： 是否允許跨域圖像繪製畫布
- `useCORS:true`：是否嘗試使用CORS從服務器加載圖像

上面兩條參數的意思有點奇妙，似乎是當 useCORS為true，allowTaint 就必須是 false，才能發揮效用。

網路上對於圖片跨域請求這件事有很多種寫法，這兩個屬性都跟「可以繼續繪製跨域圖片」有關，我自己實驗後只要添加這兩條就可成功擷取。

最終程式碼：

```javascript!
// 下載寶可夢卡片

download.addEventListener("click", block_capture);

function block_capture() {
     html2canvas(document.querySelector("#card"),{
        allowTaint:false, 
        useCORS:true
    })
    .then(function (canvas) {
      a = document.createElement("a");
      a.href = canvas
        .toDataURL("image/jpeg", 1) //數字參數是quality圖片品質，1是最高
        .replace("image/jpeg", "image/octet-stream");
      a.download = "pokemonCard.jpg";
      a.click();
    });
  }  

```



`html2canvas`可以擷取特定的 DOM 元素內容，轉成 canvas，。

> canvas 是一個 HTML tag 讓我們可以在網頁上定義一個畫布區域並由 JavaScript context 物件來即時運算圖形並且繪製。 [🔗](https://ithelp.ithome.com.tw/articles/10250333)

`html2canvas(document.querySelector("#card"),{})` ：可以指定只截取哪個元素範圍內的畫面。

> [🔗](https://mnya.tw/cc/word/1573.html)
> `a.href = canvas.toDataURL("image/jpeg", 0.92)` ：將 URL 填入 canvas 轉換成 JPG。
> `.replace("image/jpeg", "image/octet-stream")` ：將格式轉換為 `octet-stream`，這個格式可以強制瀏覽器下載。
> a.download = 'pokemonCard.jpg'：指定下載名稱
> `a.click()`：自動開啟連結（直接觸發）




### 2. 偽元素 content="" 裡面的文字下載後順序會亂掉

一開始卡片背面的文字我是利用偽元素 `.card::before` ，把中文敘述放在 `content=""` 裡面，但是背面下載下來會發現文字順序整個被打亂，圖像如下。

![image](https://hackmd.io/_uploads/H1hn9Y78n.jpg =400x)

研究一陣子發現 html2Canvans 無法擷取到偽元素的內容，所以後來調整 HTML 結構，

不用 ::before 存取文字，::before 只拿來做透黑色背景，另外用 p 元素絕對定位疊合在卡片身上，把中文敘述存在 p 元素裡面，就可以下載文字順序正常的圖片。


![image](https://hackmd.io/_uploads/SJmratQI3.jpg =400x)


html2canvas 程式碼寫法與解法參考：
- [JavaScript：將 HTML 網頁上的區塊轉換成 JPG 圖檔](https://mnya.tw/cc/word/1573.html)
- [Html2Canvas Unable to capture image](https://stackoverflow.com/questions/51206608/html2canvas-unable-to-capture-image)
- https://jsfiddle.net/qp4b8frw/14/
- [html2canvas实现浏览器截图的原理（包含源码分析的通用方法）](https://juejin.cn/post/6908255717317148685)
- [html2canvas not working with pseudo elements](https://stackoverflow.com/questions/34280350/html2canvas-not-working-with-pseudo-elements)


隨機寶可夢卡片產生器雖然是個小型Project，乍看很單純，但過程中隨著想增加的各種功能，研究可能性、報錯成因和適合的解法，一路過關斬將，做完相當有成就感。
