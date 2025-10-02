const KEY = "vocab_words_v1";
let words = JSON.parse(localStorage.getItem(KEY) || "[]");
const $ = (s) => document.querySelector(s);
const view = $("#view");
const statusMessage = $("#statusMessage");
const navButtons = document.querySelectorAll('.mode-button'); 

// ----------------------------------------------------
// 初期ロード処理 (変更なし)
// ----------------------------------------------------

if (words.length === 0) {
    statusMessage.textContent = "初回起動中...単語リストを読み込んでいます...";
    const initialContent = $("#initialViewContent");
    if (initialContent) initialContent.style.display = 'none';

    fetch("words.json")
        .then(r => r.json())
        .then(d => { 
            words = d; 
            save(); 
            renderLearn(); 
        })
        .catch(e => {
            statusMessage.textContent = "❌ 単語のロードに失敗しました。";
            console.error(e);
        });
} else {
    renderLearn();
}

function save() { 
    localStorage.setItem(KEY, JSON.stringify(words)); 
}

// ----------------------------------------------------
// モード切り替えとアクティブ状態の管理 (変更なし)
// ----------------------------------------------------

function setActiveMode(modeId) {
    navButtons.forEach(btn => {
        btn.classList.remove('active');
    });
    const activeButton = $(`#${modeId}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

$("#modeLearn").onclick = renderLearn;
$("#modeList").onclick = renderList;
$("#modeAdd").onclick = renderAdd;

// ----------------------------------------------------
// 各モードの描画関数 (学習モードを修正)
// ----------------------------------------------------

function renderLearn() {
    setActiveMode("modeLearn");
    statusMessage.textContent = `学習モード：${words.length}語から出題中...`;
    
    const initialContent = $("#initialViewContent");
    if (initialContent) initialContent.style.display = 'none';

    if (words.length === 0) {
        view.innerHTML = "<p>単語がありません。単語追加モードで追加してください。</p>";
        statusMessage.textContent = "❌ 単語がありません。";
        return;
    }

    // ランダムに単語を選択
    const q = words[Math.floor(Math.random() * words.length)];

    // 画面構成: 答え合わせボタンと「次の問題へ」ボタンを配置
    view.innerHTML = `
        <div class="learn-view">
            <h2 class="word-display">${q.en}</h2>
            <p class="instruction">この単語の意味を日本語で入力してください</p>
            <input id="answer" type="text" placeholder="答えは？" autocomplete="off" />
            <div class="button-group">
                <button id="check" class="action-button">答え合わせ</button>
                <button id="nextQuestion" class="action-button" disabled>次の問題へ</button>
            </div>
            <p id="result" class="feedback-message"></p>
        </div>
    `;
    
    const $answer = $("#answer");
    const $check = $("#check");
    const $next = $("#nextQuestion");
    const $result = $("#result");

    $answer.focus();

    // 次の問題へボタンの機能
    $next.onclick = renderLearn;

    // 答え合わせ機能
    $check.onclick = () => {
        const ans = $answer.value.trim().toLowerCase();
        const ok = ans === q.ja.toLowerCase();
        
        if (ok) {
            $result.innerHTML = "✅ **正解です！**";
            $result.classList.add('correct');
            $result.classList.remove('incorrect');
            statusMessage.textContent = "🎉 素晴らしい！次の問題へ進みましょう。";
        } else {
            $result.innerHTML = `❌ 不正解。正解は「**${q.ja}**」でした。`;
            $result.classList.add('incorrect');
            $result.classList.remove('correct');
            statusMessage.textContent = "🤔 正解を確認し、次の問題へ進みましょう。";
        }
        
        // 答え合わせ後はボタンの状態を変更
        $check.disabled = true; // 答え合わせボタンを無効化
        $next.disabled = false; // 次の問題へボタンを有効化
        $next.focus(); // 次の問題へボタンにフォーカスを移す (UX向上)
    };
    
    // Enterキーでの答え合わせに対応
    $answer.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !$check.disabled) {
            $check.click();
        }
    });

    // 答え合わせ後にEnterキーで次の問題へ進む機能を追加
    document.addEventListener('keypress', (e) => {
        // 答え合わせが済んでおり、次の問題ボタンが有効な場合
        if (e.key === 'Enter' && !$next.disabled) {
            $next.click();
        }
    }, { once: true }); // イベントリスナーを一度だけ実行し、次の問題で再設定
}

// renderList と renderAdd は変更なし
function renderList() {
    // ... (renderListのコード) ...
}

function renderAdd() {
    // ... (renderAddのコード) ...
}

// renderList と renderAdd のコードを完全に含める

function renderList() {
    setActiveMode("modeList");
    statusMessage.textContent = `単語リスト：${words.length}語を表示中...`;
    
    if (words.length === 0) {
        view.innerHTML = "<p>単語がありません。単語追加モードで追加してください。</p>";
        return;
    }
    
    view.innerHTML = `
        <ul class="word-list">
            ${words.map(w => `
                <li class="list-item">
                    <span class="english-word">${w.en}</span> - <span class="japanese-meaning">${w.ja}</span>
                </li>
            `).join("")}
        </ul>
    `;
}

function renderAdd() {
    setActiveMode("modeAdd");
    statusMessage.textContent = "追加モード：新しい単語と意味を入力してください。";
    
    view.innerHTML = `
        <div class="add-form">
            <input id="en" type="text" placeholder="英語 (例: computer)" autocomplete="off" />
            <input id="ja" type="text" placeholder="日本語 (例: コンピューター)" autocomplete="off" />
            <button id="add" class="action-button">単語を追加</button>
            <p id="addResult" class="feedback-message"></p>
        </div>
    `;
    
    $("#en").focus();

    $("#add").onclick = () => {
        const en = $("#en").value.trim();
        const ja = $("#ja").value.trim();
        
        if (!en || !ja) {
            $("#addResult").textContent = "⚠️ 英語と日本語の両方を入力してください。";
            return;
        }

        words.push({ en: en, ja: ja });
        save(); 
        
        statusMessage.textContent = `🎉 「${en}」を追加しました。現在${words.length}語。`;
        $("#addResult").textContent = `✅ 単語を追加しました: ${en} - ${ja}`;
        
        $("#en").value = "";
        $("#ja").value = "";
        $("#en").focus();
    };
    
    const addInputs = document.querySelectorAll('.add-form input');
    addInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                $("#add").click();
            }
        });
    });
}