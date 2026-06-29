// Uso: node enviar-notificacoes.js --tipo treino|ofensiva|hidratacao|peso|resumo
const admin = require('firebase-admin');

const TIPO = process.argv.find((a, i) => process.argv[i - 1] === '--tipo') ?? 'treino';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const messaging = admin.messaging();

// Data atual em BRT (UTC-3) no formato YYYY-MM-DD
function dataBRT(offsetDias = 0) {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - 3);
  d.setUTCDate(d.getUTCDate() + offsetDias);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function horaBRT() {
  const d = new Date();
  return (d.getUTCHours() - 3 + 24) % 24;
}

function calcularStreak(sessoes) {
  const datas = new Set(sessoes.filter(s => s.status !== 'rascunho' && s.data).map(s => s.data));
  if (!datas.size) return 0;
  let streak = 0;
  let offsetDias = 0;
  while (datas.has(dataBRT(offsetDias))) {
    streak++;
    offsetDias--;
  }
  return streak;
}

async function enviar(token, titulo, corpo, link = 'https://freak-mode.web.app') {
  if (!token) return;
  try {
    await messaging.send({
      token,
      notification: { title: titulo, body: corpo },
      webpush: {
        notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
        fcmOptions: { link },
      },
    });
    console.log(`✓ Enviado: ${titulo}`);
  } catch (err) {
    console.error(`✗ Falha ao enviar para token ${token.slice(0, 20)}…:`, err.message);
  }
}

async function main() {
  const usersSnap = await db.collection('users').get();
  const hoje = dataBRT(0);
  const ontem = dataBRT(-1);
  const hora = horaBRT();

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const configSnap = await db.doc(`users/${uid}/config/notificacoes`).get();
    if (!configSnap.exists) continue;
    const cfg = configSnap.data();
    if (!cfg.token) continue;

    if (TIPO === 'treino') {
      if (!cfg.treino?.ativa) continue;
      if (cfg.treino.hora !== hora) continue;

      const sessoesSnap = await db.collection(`users/${uid}/sessoes`)
        .where('data', '==', hoje).where('status', '==', 'concluida').limit(1).get();
      if (!sessoesSnap.empty) continue;

      await enviar(cfg.token, 'FreakMode 🏋️', 'Você ainda não treinou hoje! Bora?');
    }

    if (TIPO === 'ofensiva') {
      if (!cfg.ofensiva?.ativa) continue;

      const treinouHoje = !(await db.collection(`users/${uid}/sessoes`)
        .where('data', '==', hoje).where('status', '==', 'concluida').limit(1).get()).empty;
      if (treinouHoje) continue;

      const todasSnap = await db.collection(`users/${uid}/sessoes`)
        .where('status', '==', 'concluida').get();
      const sessoes = todasSnap.docs.map(d => d.data());
      const streak = calcularStreak(sessoes);
      if (streak === 0) continue;

      await enviar(cfg.token, 'Ofensiva em risco 🔥',
        `Sua sequência de ${streak} dia${streak > 1 ? 's' : ''} acaba à meia-noite. Ainda dá tempo!`);
    }

    if (TIPO === 'hidratacao') {
      if (!cfg.hidratacao?.ativa) continue;
      await enviar(cfg.token, 'Hora de hidratar 💧', 'Beba um copo d\'água agora. Seu corpo agradece!');
    }

    if (TIPO === 'peso') {
      if (!cfg.peso?.ativa) continue;
      await enviar(cfg.token, 'Lembrete de peso ⚖️', 'Segunda-feira é dia de registrar seu peso. Vai lá!');
    }

    if (TIPO === 'resumo') {
      if (!cfg.resumo?.ativa) continue;
      const inicioSemana = dataBRT(-6);
      const sessoesSnap = await db.collection(`users/${uid}/sessoes`)
        .where('status', '==', 'concluida').get();
      const semana = sessoesSnap.docs.filter(d => {
        const data = d.data().data;
        return data >= inicioSemana && data <= hoje;
      });
      const count = semana.length;
      const msg = count === 0
        ? 'Você não treinou essa semana. Que tal começar amanhã?'
        : count === 1
          ? 'Você treinou 1 vez essa semana. Continue assim!'
          : `Você treinou ${count} vezes essa semana. Incrível! 💪`;
      await enviar(cfg.token, 'Resumo da semana 📊', msg);
    }
  }

  console.log('Finalizado.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
