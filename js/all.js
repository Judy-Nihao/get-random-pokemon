//  0~20
// const apiURL = "https://pokeapi.co/api/v2/pokemon-species?offset=20&limit=20"
// 21~60
// https://pokeapi.co/api/v2/pokemon-species?offset=20&limit=40
//  id 25 是皮卡丘
// https://pokeapi.co/api/v2/pokemon/25 


//屬性主題色
const typeColor = {
    bug: "#26de81",
    dragon: "#fcde7e",
    electric: "#fed330",
    fairy: "#FF0069",
    fighting: "#30336b",
    fire: "#f0932b",
    flying: "#81ecec",
    grass: "#00b894",
    ground: "#EFB549",
    ghost: "#a55eea",
    ice: "#74b9ff",
    normal: "#95afc0",
    poison: "#6c5ce7",
    psychic: "#a29bfe",
    rock: "#2d3436",
    water: "#0190FF",
  };

//寶可夢基本資料和寶可夢小敘述是2個不同的 Endpoint
const url = "https://pokeapi.co/api/v2/pokemon/"
const quoteUrl = "https://pokeapi.co/api/v2/pokemon-species/"
const card = document.querySelector("#card");
const cardBefore = window.getComputedStyle(card, "::before");
const btn = document.querySelector("#btn");
const download = document.querySelector(".download");
let pokeNameTC= []; 

function getPokeData(){
    // 產生介於 1~150 之間的隨機整數當作id  
    // random 會從 0~150之間隨機產生浮點數，包含 0 不包含 150
    // floor 會取最接近的小於或等於整數
    // 0.00001 會變成 0，0+1=1
    // 149.999 會變成 149，149+1=150
    let id = Math.floor(Math.random() * 300) + 1;
    // console.log(id);
    // 結合 pokeapi 和 id 組出每一隻寶可夢的的專屬請求網址
    const finalUrl = url + id;
    // console.log(finalUrl);
    const finalQuoteUrl = quoteUrl + id;
 
    //========= 取得寶可夢英文資料 =========
    axios
    .get(finalUrl)
    .then((res) => {
        const pokemonData = res.data;
        generateCard(pokemonData, id);    
        })
    .catch((err) => {
        console.log(err);
    });

    // ========= 取得同一隻寶可夢的敘述 =========
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

//取得同一隻寶可夢敘述
function getQuote(quote){
    let entryArr = quote.flavor_text_entries;

    //找到中文的敘述是在索引值第幾個
    let result = entryArr.map(function(item, index) {
        return item.language.name;
    }).indexOf("zh-Hant");

    let entryText;

    if(result == -1){
        entryText = "關於這隻寶可夢還有許多未知"
    }else{
        entryText = entryArr[result].flavor_text;
    }

    // let entryText = entryArr[result].flavor_text;

    card.setAttribute("data-entryText", entryText);
    //如果遇到 flavor_text_entries 資料為空[]的狀態，由於沒有任何敘述可以尋找，map()方法會回傳空陣列[]，indexOf()找不到"zh-Hant"，回傳 -1，就填入 if 條件的文字
    //如果遇到 flavor_text_entries 不為空，但是剛好這隻寶可夢沒有中文敘述，indexOf()找不到"zh-Hant"會回傳 -1，就填入 if 條件的文字。
}


// 渲染寶可夢卡片
function generateCard(data,id){
    //抓取必要資料並存進變數中
    // console.log(data);
    const hp = data.stats[0].base_stat;
    // 有些寶可夢沒有 dream_world 版本的圖片，路徑是 null，此時就改採用另一個物件屬性的圖片路徑
    const imgSrc = data.sprites.other.dream_world.front_default || data.sprites.other.official-artwork.front_default;
    //寶可夢字母首字大寫：只對第一個字母轉大寫，從第二個字母開始的剩餘字母，則用slice(索引值)淺拷貝一個陣列出來再拼接回去
    const pokeName = data.name[0].toUpperCase() + data.name.slice(1);
    const statAttack = data.stats[1].base_stat;
    const statDefense = data.stats[2].base_stat;
    const statSpeed = data.stats[5].base_stat;
    const gifFront = data.sprites.versions["generation-v"]["black-white"]["animated"]["front_default"];
    const gifBack = data.sprites.versions["generation-v"]["black-white"]["animated"]["back_default"]

    console.log(gifFront);
    console.log(gifBack);
    
    //根據寶可夢的「第一個」屬性，對照相同屬性名稱的卡片主題色
    const themeColor = typeColor[data.types[0].type.name];
    
    card.innerHTML = `
    <div class="poke-entry">
        <p></p>
        <div class="img-wrap">
            <img src="${gifFront}" alt="">
            <img src="${gifBack}" alt="">
        </div>
    </div>
    <p class="hp">
        <span>HP</span>
        ${hp}
    </p>    
    <img src="${imgSrc}" alt="pokemon pic" >
    <h2 class="poke-name" data-pokemonId="${id}">${pokeName}</h2>
    <div class="types">
    </div>
    <div class="stats">
        <div>
            <h3>${statAttack}</h3>
            <p>攻擊</p>
        </div>
        <div>
            <h3>${statDefense}</h3>
            <p>防禦</p>
        </div>
        <div>
            <h3>${statSpeed}</h3>
            <p>速度</p>
        </div>
    </div>
    `;
    //因為types 不見得每隻都有2個，獨立抽出來另外處理
    appendTypes(data.types);

    //用抓到的屬性色碼改變卡片背景漸層色
    styleCard(themeColor);

    // 取得對應的寶可夢中文名稱
    // 先渲染出來卡片之後，才去抓 html 上面的的寶可夢 id 來用
    // 這組 axios 若放在最前面的 getPokeData()裡面執行，由於英文資料要去外部叫，中文名單則是在本地端，中文會比較快出現，
    // 速度差會導致卡片還沒渲染出來，就想要用 querySelector 找元素，會找不到 DOM元素，這樣比對名單會出錯。
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

// 名單陣列索引值是從0開始，但是寶可夢清單是從1號開始排
// 名單索引值 0 是妙蛙種子，妙蛙種子 data-pokemonId 是 1
// 所以要取中文名稱的陣列名單時，索引值要 id-1 才會是正確的對象名稱
function createChinese(names){
    let pokeNameTC = document.createElement("H2")
    pokeNameTC.className = "pokeNameTC";
    let pokeNameEN = document.querySelector(".poke-name");
    let nameID = pokeNameEN.getAttribute("data-pokemonId");
    console.log(nameID);
    console.log(names[nameID-1])
    let name = names[nameID-1]
    pokeNameTC.textContent = name;
    pokeNameEN.after(pokeNameTC);
}


// 寶可夢屬性，type 是用 createElement 處理，如果只有1個 type 就只會生出1個span
// 產生的 span 再直接加到 html 序列內，但是注意順序，必須要 card.innerHTML 先產生，選擇器才找得到 class="types" 元素
function appendTypes(types){
    types.forEach( item => {
        let span = document.createElement("SPAN");
        span.textContent = item.type.name;
        document.querySelector(".types").appendChild(span);
    })
};

//用配對後的屬性色碼，去修改卡片背景色＋屬性span文字背景色
function styleCard(color){
    card.style.backgroundImage = `radial-gradient(circle at 50% 0%, ${color} 36%, white 36%)`

    card.querySelectorAll(".types span").forEach(
        (typeText) => {
            typeText.style.backgroundColor = color;
        });
};

// 卡片點擊後就翻面＋把寶可夢敘述 Entry Text 顯示在背面
card.addEventListener("click", ()=>{
    card.classList.toggle("active");
    let pokeEntry = document.querySelector(".poke-entry");
    let pokeEntryText = pokeEntry.querySelector("p");
    pokeEntryText.textContent = card.getAttribute("data-entryText");
    pokeEntry.classList.toggle("active");

    console.log(card);
    console.log(card.firstElementChild);
})

// 點擊按鈕，就隨機產生一隻寶可夢＋若卡片處於背面就把卡片翻回正面+立刻隱藏背面資訊
// 因為手機點擊翻面時會有延遲，翻轉時會看到背面文字的鏡射狀態，乾脆用 JS 立刻隱藏
btn.addEventListener("click", function(){
    if(card.classList.contains("active")){
        card.classList.remove("active");
    };    

    let pokeEntry = document.querySelector(".poke-entry");
    pokeEntry.style.visibility = "hidden";
    getPokeData();
});


// 下載寶可夢卡片
// 備註：html2canvas 無法擷取到偽元素 content 的快照，所以內容不要放在偽元素裡面。
download.addEventListener("click", block_capture);

function block_capture() {
     html2canvas(document.querySelector("#card"),{
        letterRendering: true,
        allowTaint:false, //要加上這兩條屬性才抓得到寶可夢角色圖片，因為圖片是跨網域載入的
        useCORS	:true
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


//DOM只要一載入好也會先觸發一次隨機寶可夢產生
window.addEventListener("load", getPokeData);

