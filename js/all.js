//  0~20
// const apiURL = "https://pokeapi.co/api/v2/pokemon-species?offset=20&limit=20"
// 21~60
// https://pokeapi.co/api/v2/pokemon-species?offset=20&limit=40
//  id 25 是皮卡丘
// https://pokeapi.co/api/v2/pokemon/25 

//屬性主題色
const typeColor = {
    bug: "#26de81",
    dragon: "#ffeaa7",
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


const url = "https://pokeapi.co/api/v2/pokemon/"
const card = document.querySelector("#card");
const btn = document.querySelector("#btn");
const download = document.querySelector(".download");

function getPokeData(){
    // 產生介於 1~150 之間的隨機整數當作id  
    // random 會從 0~150之間隨機產生浮點數，包含 0 不包含 150
    // floor 會取最接近的小於或等於整數
    // 0.00001 會變成 0，0+1=1
    // 149.999 會變成 149，149+1=150
    let id = Math.floor(Math.random() * 150) + 1;
    // console.log(id);
    // 結合 pokeapi 和 id 組出每一隻寶可夢的的專屬請求網址
    const finalUrl = url + id;
    // console.log(finalUrl);

    axios
    .get(finalUrl)
    .then((res) => {
        const pokemonData = res.data;
        generateCard(pokemonData);
    })
    .catch((err) => {
        console.log(err);
    });

}


// 渲染寶可夢卡片
function generateCard(data){
    //抓取必要資料並存進變數中
    console.log(data);
    const hp = data.stats[0].base_stat;
    const imgSrc = data.sprites.other.dream_world.front_default;
    //寶可夢字母首字大寫：只對第一個字母轉大寫，從第二個字母開始的剩餘字母，則用slice(索引值)淺拷貝一個陣列出來再拼接回去
    const pokeName = data.name[0].toUpperCase() + data.name.slice(1);
    const statAttack = data.stats[1].base_stat;
    const statDefense = data.stats[2].base_stat;
    const statSpeed = data.stats[5].base_stat;
    
    //根據寶可夢的「第一個」屬性，對照相同屬性名稱的卡片主題色
    const themeColor = typeColor[data.types[0].type.name];
    console.log(themeColor)
    
    card.innerHTML = `
    <p class="hp">
        <span>HP</span>
        ${hp}
    </p>    
    <img src="${imgSrc}" alt="pokemon pic" >
    <h2 class="poke-name">${pokeName}</h2>
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
}

// type 是用 createElement 處理，如果只有1個type就只會生出1個span
// 產生的 span 再直接加到 html 序列內，但是注意順序，必須要 card.innerHTML 先產生，選擇器才找得到 class="types" 元素
function appendTypes(types){
    types.forEach( item => {
        let span = document.createElement("SPAN");
        span.textContent = item.type.name;
        console.log(span);
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


//按鈕點擊觸發隨機寶可夢產生
btn.addEventListener("click", getPokeData);


download.addEventListener("click", block_capture);

function block_capture() {
    html2canvas(document.querySelector("#card"),{
        allowTaint:false,
        useCORS	:true
    })
    .then(function (canvas) {
      a = document.createElement("a");
      a.href = canvas
        .toDataURL("image/jpeg", 1)
        .replace("image/jpeg", "image/octet-stream");
      a.download = "pokemonCard.jpg";
      a.click();
    });
  }  

// function block_capture() {
//     html2canvas(document.querySelector("#card"), {
//         onrendered: function(canvas) {
//           // document.body.appendChild(canvas);
//           return Canvas2Image.saveAsPNG(canvas);
//         }
//       });
//   }  





//DOM只要一載入好也會先觸發一次隨機寶可夢產生
window.addEventListener("load", getPokeData);

