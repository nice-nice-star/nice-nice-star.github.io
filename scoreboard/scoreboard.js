'use strict';
const statusNode = document.querySelector('#status');
const refreshButton = document.querySelector('#refresh');
let loading = false;
let hasData = false;
function cell(tag, text, className = '') {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  if (tag === 'th') element.scope = 'col';
  return element;
}
function signed(value) { return `${value > 0 ? '+' : ''}${value.toFixed(1)}`; }
function color(value) { return value > 0 ? 'positive' : value < 0 ? 'negative' : ''; }
function validate(data) {
  if (!Array.isArray(data.players) || !data.players.length || data.players.some(p => typeof p !== 'string' || !p.trim()) || new Set(data.players).size !== data.players.length || !Array.isArray(data.dates)) throw new Error('选手名单或比赛记录格式不正确');
  for (const day of data.dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !day.changes || typeof day.changes !== 'object' || Array.isArray(day.changes)) throw new Error('比赛日期或积分记录格式不正确');
    for (const [name, value] of Object.entries(day.changes)) {
      if (!data.players.includes(name) || typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value * 10 - Math.round(value * 10)) > 0.000001) throw new Error(`积分记录不正确：${day.date} ${name}；请检查姓名和分数（最多一位小数）`);
    }
  }
  return data;
}
function aggregateDays(records) {
  const dates = new Map();
  for (const record of records) {
    if (!dates.has(record.date)) dates.set(record.date, {date: record.date, changes: Object.create(null)});
    const day = dates.get(record.date);
    for (const [name, value] of Object.entries(record.changes)) {
      day.changes[name] = (Math.round((day.changes[name] ?? 0) * 10) + Math.round(value * 10)) / 10;
    }
  }
  return [...dates.values()].sort((a,b) => a.date.localeCompare(b.date));
}
function render(data) {
  const days = aggregateDays(data.dates);
  const reserved = Number.isInteger(data.reservedColumns) ? Math.max(0, Math.min(10, data.reservedColumns)) : 3;
  const ranking = data.players.map((name, index) => ({name, index, total: days.reduce((sum, day) => sum + Math.round((day.changes[name] ?? 0) * 10), 0)})).sort((a,b) => b.total - a.total || a.index - b.index);
  const header = document.createElement('tr');
  header.append(cell('th','参赛选手'), cell('th','累计积分'));
  days.forEach(day => header.append(cell('th', `${Number(day.date.slice(5,7))}.${Number(day.date.slice(8,10))}`)));
  for(let i=0;i<reserved;i++) header.append(cell('th','待定日期'));
  document.querySelector('#head').replaceChildren(header);
  let previous = null, rank = 0;
  const rows = ranking.map((player,index) => {
    if (player.total !== previous) rank = index + 1;
    previous = player.total;
    const row = document.createElement('tr');
    const name = cell('td','');
    const badge = cell('span',String(rank).padStart(2,'0'),'rank');
    badge.setAttribute('aria-label', `第${rank}名 `);
    name.append(badge,document.createTextNode(player.name));
    row.append(name,cell('td',signed(player.total / 10),`total ${color(player.total)}`));
    days.forEach(day => {
      const value = day.changes[player.name];
      row.append(cell('td',value === undefined ? '—' : signed(value),value === undefined ? 'empty' : color(value)));
    });
    for(let i=0;i<reserved;i++) row.append(cell('td','—','empty'));
    return row;
  });
  document.querySelector('#rows').replaceChildren(...rows);
  document.querySelector('#player-count').textContent = data.players.length;
  document.querySelector('#date-count').textContent = days.length;
  const last = days.at(-1);
  document.querySelector('#latest-date').textContent = last ? `${Number(last.date.slice(5,7))}.${Number(last.date.slice(8,10))}` : '待开赛';
}
async function refresh() {
  if (loading) return;
  loading = true; refreshButton.disabled = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`scores.json?t=${Date.now()}`, {cache:'no-store',signal:controller.signal});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(validate(await response.json()));
    hasData = true;
    statusNode.textContent = `已同步 ${new Date().toLocaleTimeString('zh-CN',{hour12:false})}`;
  } catch (error) {
    const reason = error.name === 'AbortError' ? '请求超时，请检查网络后重试'
      : error instanceof SyntaxError ? '积分文件不是有效的 JSON，请检查逗号和括号'
      : error instanceof TypeError ? '网络请求失败，请检查网络连接后重试'
      : error.message;
    statusNode.textContent = `${hasData ? '更新失败，保留上次积分' : '积分加载失败'}：${reason}`;
    console.error('积分加载失败', error);
  } finally { clearTimeout(timeout); loading = false; refreshButton.disabled = false; }
}
refreshButton.addEventListener('click',refresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
setInterval(() => { if (!document.hidden) refresh(); },30000);
refresh();
