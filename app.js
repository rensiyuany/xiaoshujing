
// 文件名混淆
const _p1 = "xia";
const _p2 = "oshu";
const _p3 = "ren";
const _p4 = ".";
const _p5 = "dat";
const DATA_FILE = _p1 + _p2 + _p3 + _p4 + _p5;

const CRYPTO_KEY = "Salary2025SecureKey";

let salaryData = null;
let pwdData = null;
let monthsList = [];
let currentUser = "";
let currentMonth = "";
let currentSalaryText = "";
let currentUserDetails = null;

// XOR 解密
function decryptData(encryptedBase64) {
    try {
        const binaryStr = atob(encryptedBase64);
        const encryptedBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) encryptedBytes[i] = binaryStr.charCodeAt(i);
        const keyBytes = new TextEncoder().encode(CRYPTO_KEY);
        const decrypted = new Uint8Array(encryptedBytes.length);
        for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        const jsonStr = new TextDecoder("utf-8").decode(decrypted);
        return JSON.parse(jsonStr);
    } catch(e) {
        console.error("XOR解密失败", e);
        return null;
    }
}

async function loadData() {
    const resDiv = document.getElementById('res');
    try {
        const resp = await fetch(DATA_FILE);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const encrypted = await resp.text();
        if (!encrypted || encrypted.trim() === "") throw new Error("数据文件为空");
        const data = decryptData(encrypted);
        if (!data) throw new Error("解密失败，请检查密钥");
        if (data.version !== "4.4") throw new Error(`版本不匹配 (需要4.4，数据 ${data.version})，请重新生成`);
        salaryData = data.salary;
        pwdData = data.pwd;
        monthsList = data.months;
        renderMonthButtons();
        console.log("加载成功，用户数:", Object.keys(salaryData).length);
        if (resDiv) resDiv.innerHTML = '';
    } catch(e) {
        console.error(e);
        if (resDiv) resDiv.innerHTML = `<span class="err">数据加载失败：${e.message}<br>请确保已生成最新数据。</span>`;
        resDiv.classList.add('show');
    }
}

function renderMonthButtons() {
    const box = document.getElementById('monthBox');
    if (!monthsList.length) return;
    const monthFiles = [], bonusFiles = [], otherFiles = [];
    monthsList.forEach(month => {
        if (month.includes('月')) monthFiles.push(month);
        else if (month.includes('奖')) bonusFiles.push(month);
        else otherFiles.push(month);
    });
    monthFiles.sort((a,b) => {
        let aNum = a.match(/(\d+)月/);
        let bNum = b.match(/(\d+)月/);
        return (bNum?parseInt(bNum[1]):0) - (aNum?parseInt(aNum[1]):0);
    });
    let html = '';
    if (monthFiles.length) {
        html += '<div class="button-group"><div class="group-title">📅 月度工资</div><div class="button-row">';
        monthFiles.forEach(m => html += `<div class="month-btn" onclick="switchMonth('${m}')">${m}</div>`);
        html += '</div></div>';
    }
    if (bonusFiles.length) {
        html += '<div class="button-group"><div class="group-title">🏆 奖金考核</div><div class="button-row">';
        bonusFiles.forEach(m => html += `<div class="month-btn bonus" onclick="switchMonth('${m}')">${m}</div>`);
        html += '</div></div>';
    }
    if (otherFiles.length) {
        html += '<div class="button-group"><div class="group-title">📋 其他</div><div class="button-row">';
        otherFiles.forEach(m => html += `<div class="month-btn other" onclick="switchMonth('${m}')">${m}</div>`);
        html += '</div></div>';
    }
    box.innerHTML = html;
}

function loadStoredUser() {
    const stored = localStorage.getItem("lastUser");
    if (stored) document.getElementById('name').value = stored;
}
function storeUser(name) { if (name) localStorage.setItem("lastUser", name); }

function chk() {
    let name = document.getElementById('name').value.trim();
    let pwd = document.getElementById('pwd').value.trim();
    let resDiv = document.getElementById('res');
    let monthBox = document.getElementById('monthBox');
    resDiv.innerHTML = '';
    resDiv.classList.remove('show');
    monthBox.classList.remove('show');
    if (!name || !pwd) {
        resDiv.innerHTML = '<span class="err">请填写姓名和查询代码！</span>';
        resDiv.classList.add('show');
        return;
    }
    if (pwd.length !== 6) {
        resDiv.innerHTML = '<span class="err">查询代码必须为6位！</span>';
        resDiv.classList.add('show');
        return;
    }
    if (!salaryData || !salaryData[name]) {
        resDiv.innerHTML = '<span class="err">未查询到该用户数据！</span>';
        resDiv.classList.add('show');
        return;
    }
    if (pwdData[name] !== pwd) {
        resDiv.innerHTML = '<span class="err">查询代码错误！</span>';
        resDiv.classList.add('show');
        return;
    }
    currentUser = name;
    storeUser(name);
    currentUserDetails = salaryData[name];
    monthBox.classList.add('show');
    let firstBtn = document.querySelector('.month-btn');
    if (firstBtn) switchMonth(firstBtn.innerText);
}

function switchMonth(month) {
    if (!currentUser) {
        document.getElementById('res').innerHTML = '<span class="err">请先登录！</span>';
        document.getElementById('res').classList.add('show');
        return;
    }
    currentMonth = month;
    document.querySelectorAll('.month-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === month) btn.classList.add('active');
    });
    let userData = salaryData[currentUser] && salaryData[currentUser][month];
    let resDiv = document.getElementById('res');
    if (userData && userData.text) {
        currentSalaryText = userData.text;
        resDiv.innerHTML = `<span class="suc">${userData.text.replace(/\n/g, '<br>')}</span>`;
    } else {
        currentSalaryText = "";
        resDiv.innerHTML = '<span class="err">该月份暂无数据</span>';
    }
    resDiv.classList.add('show');
}

function formatNumber(num) {
    return num === parseInt(num) ? num.toString() : num.toFixed(2);
}

function printSalary() {
    if (!currentSalaryText) { alert("请先查询工资信息！"); return; }
    let win = window.open("", "_blank");
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>工资单</title><style>body{font-family: Arial;padding:20px} .salary-slip{max-width:800px;margin:0 auto;border:1px solid #ddd;padding:30px} .header{text-align:center;border-bottom:2px solid #333} .content{white-space:pre-wrap}</style></head><body><div class="salary-slip"><div class="header"><h2>干部职工工资单</h2><p>打印时间：${new Date().toLocaleString()}</p></div><div class="content">${currentSalaryText.replace(/\n/g,'<br>')}</div></div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)};<\/script></body></html>`;
    win.document.write(html);
    win.document.close();
}

// ================== 全部详表：按原始顺序，显示所有项目 ==================
function showAllMonthsDetail() {
    if (!currentUser || !currentUserDetails) {
        alert("请先登录查询！");
        return;
    }
    const months = Object.keys(currentUserDetails);
    if (months.length === 0) {
        alert("暂无工资数据");
        return;
    }
    // 按时间顺序排序（自然顺序）
    const sortedMonths = months.slice().sort((a,b) => {
        let aNum = a.match(/(\d+)/);
        let bNum = b.match(/(\d+)/);
        if (aNum && bNum) return parseInt(aNum[1]) - parseInt(bNum[1]);
        return a.localeCompare(b);
    });
    
    // 使用第一个月份作为参考，获取原始顺序
    const refMonth = sortedMonths[0];
    const refDetails = currentUserDetails[refMonth].details;
    const incomeOrder = Object.keys(refDetails.income_items || {});
    const deductionOrder = Object.keys(refDetails.deduction_items || {});
    
    // 收集所有项目（收入+扣除），保持顺序并追加新出现的
    let allIncomeItems = [...incomeOrder];
    let allDeductionItems = [...deductionOrder];
    for (let m of sortedMonths.slice(1)) {
        const details = currentUserDetails[m].details;
        if (details) {
            for (let item of Object.keys(details.income_items || {})) {
                if (!allIncomeItems.includes(item)) allIncomeItems.push(item);
            }
            for (let item of Object.keys(details.deduction_items || {})) {
                if (!allDeductionItems.includes(item)) allDeductionItems.push(item);
            }
        }
    }
    const finalOrder = [...allIncomeItems, ...allDeductionItems];
    
    // 生成月份复选框
    let checkboxesHtml = '<div style="margin:15px 0; padding:10px; background:#f9f9f9; border-radius:8px;"><div style="margin-bottom:8px;"><strong>选择要显示的月份：</strong> <button type="button" onclick="toggleAllMonths(true)">全选</button> <button type="button" onclick="toggleAllMonths(false)">全不选</button></div><div style="display:flex; flex-wrap:wrap; gap:8px;">';
    sortedMonths.forEach((m, idx) => {
        checkboxesHtml += `<label style="margin-right:12px;"><input type="checkbox" class="month-checkbox" value="${m}" data-idx="${idx}" checked> ${m}</label>`;
    });
    checkboxesHtml += '</div></div>';
    
    // 生成表格
    let tableHtml = `<div id="allMonthsTableContainer" style="overflow-x:auto;"><table id="detailTable" class="detail-table" border="1"><thead><tr><th>工资项目</th>`;
    for (let m of sortedMonths) {
        tableHtml += `<th class="col-month" data-month="${m}">${m}</th>`;
    }
    tableHtml += `</thead><tbody>`;
    
    for (let item of finalOrder) {
        tableHtml += `<tr><td class="item-name">${item}</td>`;
        for (let m of sortedMonths) {
            let val = 0;
            const details = currentUserDetails[m].details;
            if (details) {
                val = details.income_items[item] || details.deduction_items[item] || 0;
            }
            tableHtml += `<td class="number col-month" data-month="${m}">${formatNumber(val)}</td>`;
        }
        tableHtml += `</tr>`;
    }
    // 汇总行
    tableHtml += `<tr style="background:#f0f0f0"><td class="item-name"><strong>应发合计</strong></td>`;
    for (let m of sortedMonths) {
        let total = currentUserDetails[m].details?.total_income || 0;
        tableHtml += `<td class="number col-month" data-month="${m}"><strong>${formatNumber(total)}</strong></td>`;
    }
    tableHtml += `</tr><tr style="background:#f0f0f0"><td class="item-name"><strong>扣除合计</strong></td>`;
    for (let m of sortedMonths) {
        let total = currentUserDetails[m].details?.total_deduction || 0;
        tableHtml += `<td class="number col-month" data-month="${m}"><strong>${formatNumber(total)}</strong></td>`;
    }
    tableHtml += `<tr><tr style="background:#ffe0b3"><td class="item-name"><strong>实发金额</strong></td>`;
    for (let m of sortedMonths) {
        let net = currentUserDetails[m].details?.net_income || 0;
        tableHtml += `<td class="number col-month" data-month="${m}"><strong>${formatNumber(net)}</strong></td>`;
    }
    tableHtml += `</tr></tbody></table></div><div style="text-align:center; margin-top:15px"><button onclick="printAllMonthsTable()">🖨️ 打印当前显示的表格</button></div>`;
    
    const resDiv = document.getElementById('res');
    resDiv.innerHTML = checkboxesHtml + tableHtml;
    resDiv.classList.add('show');
    
    // 绑定复选框事件
    const checkboxes = document.querySelectorAll('.month-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => updateTableColumns());
    });
}

function toggleAllMonths(checked) {
    const checkboxes = document.querySelectorAll('.month-checkbox');
    checkboxes.forEach(cb => cb.checked = checked);
    updateTableColumns();
}

function updateTableColumns() {
    const selectedMonths = new Set();
    document.querySelectorAll('.month-checkbox:checked').forEach(cb => selectedMonths.add(cb.value));
    const allMonthCols = document.querySelectorAll('.col-month');
    allMonthCols.forEach(col => {
        const month = col.getAttribute('data-month');
        if (selectedMonths.has(month)) {
            col.style.display = '';
        } else {
            col.style.display = 'none';
        }
    });
}

function printAllMonthsTable() {
    const container = document.getElementById('allMonthsTableContainer');
    if (!container || !container.innerHTML) { alert("请先生成表格"); return; }
    const win = window.open("", "_blank");
    const cloneTable = container.cloneNode(true);
    const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>工资全部详表</title><style>body{font-family:Arial;padding:20px} .detail-table{border-collapse:collapse;width:100%} .detail-table th,.detail-table td{border:1px solid #999;padding:6px;text-align:center} .detail-table .item-name{text-align:left} .number{text-align:right} h3{text-align:center} @media print{body{margin:0;padding:10px}}</style></head><body><h3 style="text-align:center">${currentUser} 工资全部详表</h3>${cloneTable.outerHTML}<div style="text-align:center;margin-top:20px">打印时间：${new Date().toLocaleString()}</div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)};<\/script></body></html>`;
    win.document.write(printHtml);
    win.document.close();
}

window.onload = () => { loadStoredUser(); loadData(); };
document.getElementById('pwd').addEventListener('keypress', e => { if(e.key === 'Enter') chk(); });
