// Cloud Function agendada: a cada 5 minutos confere quem ainda não fez a tarefa
// depois do horário e manda push (mesmo com o app fechado).
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const TODOS = [0, 1, 2, 3, 4, 5, 6];

// Textos do aviso por idioma (o idioma vem de users/{uid}.lang, salvo pelo app)
const TXT = {
  pt: { risk: (n, s, d) => `Você ainda não fez "${n}". Sua sequência de ${s} ${d} está em risco.`, time: (n) => `Hora de fazer: "${n}".`, d1: 'dia', dn: 'dias' },
  en: { risk: (n, s, d) => `You haven't done "${n}" yet. Your ${s}-${d} streak is at risk.`, time: (n) => `Time to do: "${n}".`, d1: 'day', dn: 'day' },
  es: { risk: (n, s, d) => `Aún no has hecho "${n}". Tu racha de ${s} ${d} está en riesgo.`, time: (n) => `Hora de hacer: "${n}".`, d1: 'día', dn: 'días' },
  fr: { risk: (n, s, d) => `Vous n'avez pas encore fait « ${n} ». Votre série de ${s} ${d} est en danger.`, time: (n) => `C'est l'heure : « ${n} ».`, d1: 'jour', dn: 'jours' },
  de: { risk: (n, s, d) => `Du hast „${n}“ noch nicht erledigt. Deine ${s}-${d}-Serie ist in Gefahr.`, time: (n) => `Zeit für: „${n}“.`, d1: 'Tag', dn: 'Tage' },
  ja: { risk: (n, s) => `「${n}」をまだ完了していません。${s}日連続の記録が途切れそうです。`, time: (n) => `「${n}」の時間です。`, d1: '日', dn: '日' },
  zh: { risk: (n, s) => `你还没有完成“${n}”。你的${s}天连续记录有中断的风险。`, time: (n) => `该做“${n}”了。`, d1: '天', dn: '天' },
  ko: { risk: (n, s) => `아직 "${n}"을(를) 하지 않았어요. ${s}일 연속 기록이 위험해요.`, time: (n) => `"${n}" 할 시간이에요.`, d1: '일', dn: '일' },
  hi: { risk: (n, s) => `आपने अभी तक "${n}" नहीं किया। आपकी ${s} दिन की लकीर खतरे में है।`, time: (n) => `"${n}" करने का समय हो गया।`, d1: 'दिन', dn: 'दिन' },
  ar: { risk: (n, s) => `لم تُنجز "${n}" بعد. سلسلتك التي استمرت ${s} يومًا في خطر.`, time: (n) => `حان وقت: "${n}".`, d1: 'يوم', dn: 'أيام' }
};
const INTERVALO_MIN = 30;   // repete o aviso a cada 30 min até você marcar
const MAX_AVISOS = 6;       // no máximo 6 avisos por tarefa por dia

// ---- datas no fuso de cada usuário ----
function agoraNoFuso(tz) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return { data: `${g('year')}-${g('month')}-${g('day')}`, hora: `${g('hour')}:${g('minute')}` };
}
const wd = (d) => new Date(d + 'T12:00:00Z').getUTCDay();
const addD = (d, n) => {
  const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const agendada = (t, d) => (t.data ? t.data === d : (t.sem || TODOS).includes(wd(d)));

function streak(t, hoje) {
  if (t.data) return (t.dias || []).length ? 1 : 0;
  const dias = t.dias || [];
  let d = hoje, n = 0;
  if (agendada(t, d) && !dias.includes(d)) d = addD(d, -1);
  for (let i = 0; i < 800; i++) {
    if (agendada(t, d)) { if (dias.includes(d)) n++; else break; }
    d = addD(d, -1);
  }
  return n;
}

exports.lembretesDisciplina = onSchedule(
  { schedule: 'every 5 minutes', timeZone: 'America/Sao_Paulo', region: 'southamerica-east1' },
  async () => {
    const habitos = await db.collectionGroup('habits').get();
    const cache = {}; // uid -> { tz, tokens }
    const agora = Date.now();
    let enviados = 0, semToken = 0, falhas = 0;

    for (const doc of habitos.docs) {
      const uid = doc.ref.parent.parent.id;
      const t = doc.data();
      const dias = t.dias || [];

      if (!cache[uid]) {
        const [u, tk] = await Promise.all([
          db.collection('users').doc(uid).get(),
          db.collection('users').doc(uid).collection('tokens').get()
        ]);
        cache[uid] = { tz: (u.exists && u.data().tz) || 'America/Sao_Paulo', lang: (u.exists && TXT[u.data().lang] ? u.data().lang : 'pt'), tokens: tk.docs.map((x) => x.id) };
      }
      const { tz, lang, tokens } = cache[uid];
      if (!tokens.length) { semToken++; continue; }

      const { data: hoje, hora: agoraHora } = agoraNoFuso(tz);
      if (!agendada(t, hoje) || dias.includes(hoje)) continue;      // não é hoje ou já feita
      if (agoraHora < (t.hora || '00:00')) continue;                 // ainda não deu o horário

      const contHoje = t.avisoData === hoje ? (t.avisoCount || 0) : 0;
      if (contHoje >= MAX_AVISOS) continue;
      if (t.ultimoAviso && agora - t.ultimoAviso < INTERVALO_MIN * 60000) continue;

      const s = streak(t, hoje);
      const L = TXT[lang];
      // em inglês e alemão a palavra fica no singular antes de "streak/Serie" (ex.: 5-day)
      const d = lang === 'en' || lang === 'de' ? L.d1 : (s === 1 ? L.d1 : L.dn);
      const body = s > 0 ? L.risk(t.nome, s, d) : L.time(t.nome);

      const resp = await admin.messaging().sendEachForTokens({
        tokens,
        data: { title: 'Disciplina', body, tag: 'disc-' + doc.id },
        webpush: { headers: { Urgency: 'high', TTL: '3600' } }
      });

      enviados += resp.successCount; falhas += resp.failureCount;
      resp.responses.forEach((r) => { if (!r.success) console.error('FCM falhou:', r.error && r.error.code, r.error && r.error.message); });

      // limpa tokens que não existem mais
      const mortos = [];
      resp.responses.forEach((r, i) => {
        const c = r.error && r.error.code;
        if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') mortos.push(tokens[i]);
      });
      await Promise.all(mortos.map((tk) => db.collection('users').doc(uid).collection('tokens').doc(tk).delete()));
      cache[uid].tokens = tokens.filter((x) => !mortos.includes(x));

      await doc.ref.update({ ultimoAviso: agora, avisoData: hoje, avisoCount: contHoje + 1 });
    }
    console.log(`lembretes: ${habitos.size} tarefas | enviados=${enviados} falhas=${falhas} tarefas_sem_token=${semToken}`);
  }
);


// Teste imediato: o app chama esta função para mandar um push de teste ao próprio usuário.
// "delay" (até 30 s) dá tempo de fechar o app antes do envio.
exports.testarPush = onCall({ region: 'southamerica-east1', timeoutSeconds: 60 }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Faça login.');
  const uid = req.auth.uid;
  const delay = Math.min(Math.max(Number(req.data && req.data.delay) || 0, 0), 30);
  const tk = await db.collection('users').doc(uid).collection('tokens').get();
  const tokens = tk.docs.map((d) => d.id);
  if (!tokens.length) return { ok: false, motivo: 'sem-token' };
  if (delay) await new Promise((r) => setTimeout(r, delay * 1000));
  const resp = await admin.messaging().sendEachForTokens({
    tokens,
    data: { title: 'Disciplina', body: 'Teste de notificação ✓', tag: 'disc-teste' },
    webpush: { headers: { Urgency: 'high', TTL: '300' } }
  });
  const erros = [];
  const mortos = [];
  resp.responses.forEach((r, i) => {
    if (!r.success) {
      const c = (r.error && r.error.code) || 'erro';
      erros.push(c);
      if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') mortos.push(tokens[i]);
    }
  });
  await Promise.all(mortos.map((t) => db.collection('users').doc(uid).collection('tokens').doc(t).delete()));
  console.log(`teste uid=${uid} enviados=${resp.successCount} falhas=${resp.failureCount} ${erros.join(',')}`);
  return { ok: resp.successCount > 0, enviados: resp.successCount, falhas: resp.failureCount, erros };
});
