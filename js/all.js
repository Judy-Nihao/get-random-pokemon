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
const btn = document.querySelector("#btn");
const download = document.querySelector(".download");
const flip = document.querySelector("#flip");
let latestRequest = 0;
let loading = false;
let capturing = false;
let skeletonTimer;
const status = document.querySelector("#load-status");
const retry = document.querySelector("#retry");
const toast = document.querySelector("#toast");
const toastMessage = document.querySelector("#toast-message");
const toastIcon = document.querySelector("#toast-icon");
const toastClose = document.querySelector("#toast-close");
let toastTimer;
let toastDuration = 0;

function hideToast(){
    clearTimeout(toastTimer);
    if (toast.contains(document.activeElement)) btn.focus();
    toast.hidden = true;
    toastMessage.textContent = "";
}

function scheduleToastDismiss(){
    clearTimeout(toastTimer);
    if (toastDuration && !toast.matches(":hover") && !toast.contains(document.activeElement)) {
        toastTimer = setTimeout(hideToast, toastDuration);
    }
}

function notify(message, kind = "success", canRetry = false){
    clearTimeout(toastTimer);
    toast.dataset.kind = kind;
    toastIcon.className = kind === "success" ? "bx bx-check-circle" : "bx bx-error-circle";
    retry.hidden = !canRetry;
    toast.hidden = false;
    toastMessage.textContent = message;
    toastDuration = kind === "error" ? 0 : kind === "warning" ? 10000 : 6000;
    scheduleToastDismiss();
}

toastClose.addEventListener("click", hideToast);
toast.addEventListener("pointerenter", () => clearTimeout(toastTimer));
toast.addEventListener("pointerleave", scheduleToastDismiss);
toast.addEventListener("focusin", () => clearTimeout(toastTimer));
toast.addEventListener("focusout", () => setTimeout(scheduleToastDismiss, 0));
toast.addEventListener("keydown", event => { if (event.key === "Escape") hideToast(); });

let namesPromise;
const fallbackDescription = "關於這隻寶可夢還有許多未知";
const missingImage = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="220" viewBox="0 0 240 220"><rect width="240" height="220" rx="24" fill="#eeeae0"/><text x="120" y="130" text-anchor="middle" font-size="64" fill="#63563a">?</text></svg>');

function loadNames(){
    if (!namesPromise) namesPromise = axios.get("js/zh-hant.json", {timeout: 10000})
        .then(res => res.data).catch(error => { namesPromise = null; throw error; });
    return namesPromise;
}

function loadImage(source){
    return new Promise(resolve => {
        if (!source) return resolve(null);
        const image = new Image();
        const timer = setTimeout(() => finish(null), 10000);
        function finish(result){
            clearTimeout(timer);
            image.onload = image.onerror = null;
            resolve(result);
        }
        image.crossOrigin = "anonymous";
        image.onload = () => finish(source);
        image.onerror = () => finish(null);
        image.src = source;
    });
}

function setLoading(value){
    loading = value;
    clearTimeout(skeletonTimer);
    if (value) {
        status.textContent = "載入中…";
        hideToast();
        skeletonTimer = setTimeout(showSkeleton, card.querySelector(".card-front") ? 180 : 0);
    } else {
        card.classList.remove("is-loading");
        card.querySelector(".card-skeleton")?.remove();
    }
    card.setAttribute("aria-busy", String(value));
    btn.classList.toggle("is-loading", value);
    syncControls();
}

function syncControls(){
    const ready = Boolean(card.querySelector(".card-front"));
    card.classList.toggle("is-capturing", capturing);
    btn.disabled = loading || capturing;
    download.disabled = loading || capturing || !ready;
    flip.disabled = loading || capturing || !ready;
}

function showSkeleton(){
    if (!loading) return;
    const skeleton = document.createElement("div");
    skeleton.className = "card-skeleton";
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.innerHTML = '<div class="skeleton-hp skeleton-piece"></div><div class="skeleton-image skeleton-piece"></div><div class="skeleton-name skeleton-piece"></div><div class="skeleton-name short skeleton-piece"></div><div class="skeleton-types skeleton-piece"></div><div class="skeleton-stats"><span class="skeleton-piece"></span><span class="skeleton-piece"></span><span class="skeleton-piece"></span></div>';
    card.appendChild(skeleton);
    card.classList.add("is-loading");
}

retry.addEventListener("click", getPokeData);

async function getPokeData(){
    if (loading || capturing) return;
    const request = ++latestRequest;
    const id = Math.floor(Math.random() * 250) + 1;
    setCardFlipped(false);
    setLoading(true);
    try {
        const [pokemon, species, names] = await Promise.allSettled([
            axios.get(url + id, {timeout: 10000}),
            axios.get(quoteUrl + id, {timeout: 10000}),
            loadNames()
        ]);
        if (pokemon.status !== "fulfilled") throw pokemon.reason;
        const data = pokemon.value.data;
        const artwork = data.sprites.other?.["official-artwork"]?.front_default;
        const primary = data.sprites.other?.dream_world?.front_default;
        const image = await loadImage(primary || artwork) ||
            (primary && artwork && primary !== artwork ? await loadImage(artwork) : null);
        if (request !== latestRequest) return;
        const description = species.status === "fulfilled"
            ? species.value.data.flavor_text_entries.find(entry => entry.language.name.toLowerCase() === "zh-hant")?.flavor_text
            : null;
        card.setAttribute("data-entryText", description || fallbackDescription);
        generateCard(data, id, names.status === "fulfilled" ? names.value : [], image || missingImage);
        status.textContent = "";
        if (!image) notify("圖片暫時無法載入，已顯示替代圖。", "warning");
        else if (names.status !== "fulfilled") notify("中文名稱暫時無法載入。", "warning");
    } catch (error) {
        if (request === latestRequest) {
            status.textContent = "";
            notify("載入失敗，請再試一次。", "error", true);
            if (!card.querySelector(".card-front")) card.innerHTML = '<div class="card-empty">暫時找不到寶可夢<br>請點選重試</div>';
        }
    } finally {
        if (request === latestRequest) setLoading(false);
    }
}

// 渲染寶可夢卡片
function generateCard(data, id, names, imageSource){
    //抓取必要資料並存進變數中
    // console.log(data);
    const hp = data.stats[0].base_stat;
    // 有些寶可夢沒有 dream_world 版本的圖片，路徑是 null，此時就改採用另一個物件屬性的圖片路徑
    const imgSrc = imageSource;
    //寶可夢字母首字大寫：只對第一個字母轉大寫，從第二個字母開始的剩餘字母，則用slice(索引值)淺拷貝一個陣列出來再拼接回去
    const pokeName = data.name[0].toUpperCase() + data.name.slice(1);
    const statAttack = data.stats[1].base_stat;
    const statDefense = data.stats[2].base_stat;
    const statSpeed = data.stats[5].base_stat;
    const gifFront = data.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.front_default;
    const gifBack = data.sprites.versions?.["generation-v"]?.["black-white"]?.animated?.back_default;

    
    //根據寶可夢的「第一個」屬性，對照相同屬性名稱的卡片主題色
    const themeColor = typeColor[data.types[0].type.name];
    
    card.innerHTML = `
    <div class="card-rotator">
    <div class="card-face poke-entry" aria-hidden="true">
        <p></p>
        <div class="img-wrap">
            ${gifFront ? `<img src="${gifFront}" alt="正面動態圖">` : ""}
            ${gifBack ? `<img src="${gifBack}" alt="背面動態圖">` : ""}
        </div>
    </div>
    <div class="card-face card-front">
    <p class="hp">
        <span>HP</span>
        ${hp}
    </p>    
    <img class="pokemon-image" src="${imgSrc}" alt="${pokeName}" >
    <h2 class="poke-name" data-pokemonId="${id}"><span>${pokeName}</span></h2>
    <h2 class="pokeNameTC"><span></span></h2>
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
    </div>
    </div>
    `;
    setCardFlipped(false);
    //因為types 不見得每隻都有2個，獨立抽出來另外處理
    appendTypes(data.types);

    //用抓到的屬性色碼改變卡片背景漸層色
    styleCard(themeColor);
    fitPokemonNames();

    createChinese(names);
}

// 名單陣列索引值是從0開始，但是寶可夢清單是從1號開始排
// 名單索引值 0 是妙蛙種子，妙蛙種子 data-pokemonId 是 1
// 所以要取中文名稱的陣列名單時，索引值要 id-1 才會是正確的對象名稱
function createChinese(names){
    // 中文載入前已保留名稱區，避免插入元素造成版面位移。
    let pokeNameTC = card.querySelector(".pokeNameTC span");

    // 抓取 DOM 上面的寶可夢 data-pokemonId
    let pokeNameEN = document.querySelector(".poke-name");
    let nameID = pokeNameEN.getAttribute("data-pokemonId");

    // 寶可夢 id -1 才是正確的同一隻寶可夢中文清單索引值
    let name = names[nameID-1] || "名稱暫缺";
    pokeNameTC.textContent = name;
    
    fitPokemonNames();
}

// 保留完整名稱；固定名稱區放不下時，逐步縮小字級，不裁切文字。
function fitPokemonNames(){
    card.querySelectorAll(".poke-name, .pokeNameTC").forEach((element) => {
        const text = element.querySelector("span");
        const isEnglish = element.classList.contains("poke-name");
        const minimumSize = isEnglish ? 16 : 14;
        let size = isEnglish ? 28 : 20;
        element.style.fontSize = `${size}px`;
        while (size > minimumSize && (text.offsetHeight > Math.min(element.clientHeight, size * 1.2 * 2) + 1 || text.scrollWidth > element.clientWidth)) {
            size -= 0.5;
            element.style.fontSize = `${size}px`;
        }
    });
}

// 字型載入及視窗尺寸變動後重新量測，避免以替代字型的尺寸定案。
document.fonts.ready.then(fitPokemonNames);
window.addEventListener("resize", fitPokemonNames);


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
    card.querySelector(".card-front").style.backgroundImage = `radial-gradient(circle at 50% 0%, ${color} 36%, white 36%)`

    card.querySelectorAll(".types span").forEach(
        (typeText) => {
            typeText.style.backgroundColor = color;
            typeText.style.color = readableTypeColor(color);
        });
};

// 以相對亮度比較深色與白色文字，保留屬性底色。
function readableTypeColor(hex){
    const channels = hex.slice(1).match(/.{2}/g).map(value => {
        const channel = parseInt(value, 16) / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    // 深字使用純黑，確保任一底色至少有一組達到 4.5:1。
    return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? "#000" : "#fff";
}

// 卡片點擊後就翻面＋把寶可夢敘述 Entry Text 顯示在背面
function setCardFlipped(flipped){
    card.classList.toggle("active", flipped);
    const front = card.querySelector(".card-front");
    const back = card.querySelector(".poke-entry");
    if (!front || !back) return;
    front.setAttribute("aria-hidden", String(flipped));
    back.setAttribute("aria-hidden", String(!flipped));
    flip.setAttribute("aria-label", flipped ? "顯示寶可夢正面" : "顯示寶可夢背面");
    flip.querySelector("span").textContent = flipped ? "翻回正面" : "翻面";
    back.querySelector("p").textContent = card.getAttribute("data-entryText") || "關於這隻寶可夢還有許多未知";
}

card.addEventListener("click", ()=>{
    if (!loading && !capturing && card.querySelector(".card-front")) setCardFlipped(!card.classList.contains("active"));
});
flip.addEventListener("click", () => {
    if (!loading && !capturing && card.querySelector(".card-front")) setCardFlipped(!card.classList.contains("active"));
});

// 抽卡時回到正面；舊請求完成時不覆蓋目前這一隻的資料。
btn.addEventListener("click", function(){
    setCardFlipped(false);
    getPokeData();
});


// 下載寶可夢卡片
// 備註：html2canvas 無法擷取到偽元素 content 的快照，所以內容不要放在偽元素裡面。
download.addEventListener("click", block_capture);

async function captureCardFace(captureBack){
    return html2canvas(card, {
        allowTaint: false,
        useCORS: true,
        backgroundColor: null,
        // 只攤平擷取副本；不改動畫面上的正反面狀態。
        onclone: (clonedDocument) => {
            const clone = clonedDocument.querySelector("#card");
            clone.style.perspective = "none";
            const rotator = clone.querySelector(".card-rotator");
            rotator.style.transition = "none";
            rotator.style.animation = "none";
            rotator.style.rotate = "none";
            rotator.style.transform = "none";
            clone.querySelectorAll(".card-face").forEach((face) => {
                const visible = face.classList.contains("poke-entry") === captureBack;
                face.style.display = visible ? "flex" : "none";
                face.style.transform = "none";
                face.style.backfaceVisibility = "visible";
                face.style.webkitBackfaceVisibility = "visible";
                face.setAttribute("aria-hidden", String(!visible));
            });
        }
    });
}

async function block_capture(){
    if (loading || capturing || !card.querySelector(".card-front")) return;
    capturing = true;
    syncControls();
    download.setAttribute("aria-busy", "true");
    hideToast();
    status.textContent = "正在準備正反面圖片…";
    try {
        await document.fonts.ready;
        // 兩面都成功產生後才送出下載，避免第二面擷取失敗時只拿到第一面。
        const front = await captureCardFace(false);
        const back = await captureCardFace(true);
        const name = card.querySelector(".poke-name span").textContent
            .toLowerCase().replace(/[^a-z0-9-]/g, "-");
        const images = [
            {side: "front", canvas: front},
            {side: "back", canvas: back}
        ].map(({side, canvas}) => ({
            filename: `pokemon-${name}-${side}.png`,
            url: canvas.toDataURL("image/png")
        }));
        images.forEach(({filename, url}) => {
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
        });
        status.textContent = "";
        notify("已送出正反面下載。若瀏覽器詢問，請允許多個檔案下載。");
    } catch (error) {
        status.textContent = "";
        notify("圖片產生失敗，請再點 Download 重試。", "error");
    } finally {
        capturing = false;
        download.removeAttribute("aria-busy");
        syncControls();
    }
}

//DOM只要一載入好也會先觸發一次隨機寶可夢產生
window.addEventListener("load", getPokeData);
