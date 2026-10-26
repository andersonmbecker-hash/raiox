import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// ── Prompt do sistema ───────────────────────────────────────────
const PROMPT_SISTEMA = `Você é um especialista em posicionamento de marca da Buzina Digital, treinado no método MCI (Mapa da Comunicação Intencional). Analisa bios de profissionais independentes e fornece avaliações precisas e sugestões de melhoria.

CRITÉRIOS DE AVALIAÇÃO MCI:

COMUNICAÇÃO (0.0 a 10.0)
Mede a clareza do que o profissional faz. Nota 10: qualquer pessoa entende em 3 segundos o serviço e o resultado, sem ambiguidade.
Avalie: verbo de ação presente, serviço ou resultado explícito, ausência de linguagem vaga ou genérica.

IDENTIFICAÇÃO (0.0 a 10.0)
Mede o quanto o público-alvo se reconhece na bio. Nota 10: o leitor ideal pensa "isso é para mim" imediatamente.
Avalie: menção à transformação ou resultado do cliente, referência a dor ou desejo do público, conexão emocional direta.

CLAREZA (0.0 a 10.0)
Mede simplicidade e acessibilidade da linguagem. Nota 10: linguagem limpa, sem jargão, leitura fluida e adequada para o perfil etário do público.
Avalie: ausência de termos técnicos ou jargão profissional, economia de palavras, estrutura direta.

ESTRUTURA IDEAL DE BIO (método MCI):
[QUEM VOCÊ ATENDE] + [TRANSFORMAÇÃO OU RESULTADO ENTREGUE] + [DIFERENCIAL ÚNICO] + [ELEMENTO HUMANO opcional]
Exemplo: "Ajudo médicos e dentistas a crescerem no digital sem perder tempo. Método validado com mais de 200 profissionais de saúde. Pai de dois."

REGRAS ABSOLUTAS:
- Bio Instagram: MÁXIMO 150 caracteres, contando espaços e pontuação. Conte duas vezes antes de finalizar.
- Bio Instagram SEMPRE segue exatamente 3 frases curtas, nesta ordem:
    1. O que faz (verbo de ação + resultado ou nicho, direto ao ponto)
    2. Para quem é (público-alvo em 3 a 6 palavras)
    3. CTA (uma ação clara: link, DM, palavra-chave — sem "clique aqui")
  Exemplo: "Transformo marcas pessoais em negócios lucrativos. Para coaches e consultores. Manda 'MARCA' no DM."
- Nunca use travessão (—). Use vírgulas, parênteses ou ponto final.
- O tom deve combinar com o perfil etário do público informado.
- Incorpore o elemento pessoal principalmente na bio completa.
- Seja criterioso nas notas. A maioria das bios tem problemas sérios. Nota 7 já é acima da média; 8 é excelente; 9 é rara.
- A análise deve apontar especificamente o que falta ou prejudica a bio atual.

FORMATO DE RESPOSTA — use EXATAMENTE esta estrutura JSON, com estes nomes de campos (sem acentos nas chaves):

{
  "score_geral": 6.5,
  "notas": {
    "comunicacao": 7.0,
    "identificacao": 6.0,
    "clareza": 6.5
  },
  "analise": "Parágrafo único com a análise crítica da bio atual, apontando o que falta e por quê a nota ficou nesse nível.",
  "sugestoes": [
    {
      "tipo": "Instagram",
      "subtitulo": "Direta e com CTA",
      "texto": "Texto da bio sugerida para Instagram (máximo 150 caracteres, 3 frases: o que faz, para quem, CTA)."
    },
    {
      "tipo": "LinkedIn",
      "subtitulo": "Completa e profissional",
      "texto": "Texto da bio sugerida para LinkedIn (até 300 caracteres, mais elaborada)."
    },
    {
      "tipo": "Completa",
      "subtitulo": "Para site ou portfólio",
      "texto": "Texto da bio completa para usar em site, apresentações ou portfólio (sem limite de caracteres)."
    }
  ]
}

Responda SOMENTE com o JSON acima, sem texto antes ou depois, sem blocos de markdown.`;

// ── Email HTML ──────────────────────────────────────────────────
function buildEmailHTML(nome, resultado) {
  const { score_geral, notas, analise, sugestoes } = resultado;
  const primeiroNome = (nome || 'Profissional').split(' ')[0];

  const corScore = score_geral >= 8 ? '#22c55e' : score_geral >= 6 ? '#f59e0b' : '#ef4444';

  const sugestoesHTML = sugestoes.map(s => `
    <tr>
      <td style="padding:0 0 20px 0">
        <div style="background:#1e293b;border-radius:10px;padding:20px;border-left:4px solid #6366f1">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6366f1;letter-spacing:.08em;text-transform:uppercase">${s.tipo} <span style="color:#64748b;font-weight:400;text-transform:none">&mdash; ${s.subtitulo}</span></p>
          <p style="margin:0;font-size:15px;color:#e2e8f0;line-height:1.6">${s.texto}</p>
        </div>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 28px;text-align:center">
              <p style="margin:0;font-size:13px;font-weight:700;color:#6366f1;letter-spacing:.12em;text-transform:uppercase">Buzina Digital</p>
              <h1 style="margin:8px 0 0;font-size:26px;font-weight:800;color:#f8fafc">🎯 Raio-X da Bio</h1>
            </td>
          </tr>

          <!-- Score card -->
          <tr>
            <td style="padding:0 0 28px">
              <div style="background:linear-gradient(135deg,#1e1b4b 0%,#1e293b 100%);border-radius:16px;padding:32px;text-align:center;border:1px solid #312e81">
                <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;letter-spacing:.1em;text-transform:uppercase">Score Geral</p>
                <p style="margin:0;font-size:64px;font-weight:900;color:${corScore};line-height:1">${score_geral.toFixed(1)}</p>
                <p style="margin:8px 0 24px;font-size:14px;color:#94a3b8">de 10.0</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="text-align:center;border-right:1px solid #334155">
                      <p style="margin:0;font-size:22px;font-weight:700;color:#e2e8f0">${notas.comunicacao.toFixed(1)}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Comunicação</p>
                    </td>
                    <td style="text-align:center;border-right:1px solid #334155">
                      <p style="margin:0;font-size:22px;font-weight:700;color:#e2e8f0">${notas.identificacao.toFixed(1)}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Identificação</p>
                    </td>
                    <td style="text-align:center">
                      <p style="margin:0;font-size:22px;font-weight:700;color:#e2e8f0">${notas.clareza.toFixed(1)}</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Clareza</p>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Análise -->
          <tr>
            <td style="padding:0 0 24px">
              <div style="background:#1e293b;border-radius:10px;padding:20px">
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase">Análise</p>
                <p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.7">${analise}</p>
              </div>
            </td>
          </tr>

          <!-- Sugestões -->
          <tr>
            <td>
              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase">3 Sugestões de Bio para você</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${sugestoesHTML}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;border-top:1px solid #1e293b">
              <p style="margin:0 0 4px;font-size:12px;color:#475569">Este e-mail foi gerado pelo Raio-X da Bio</p>
              <p style="margin:0;font-size:12px;color:#334155">&copy; ${new Date().getFullYear()} Buzina Digital. Todos os direitos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Handler principal ───────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    nome, email,
    bio_atual, instagram,
    idade_publico, transformacao, nicho, pessoal,
  } = req.body || {};

  if (!email || !bio_atual || !nicho) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes: email, bio_atual, nicho.' });
  }

  const emailNorm = email.toLowerCase().trim();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // ── Verificar cache ──────────────────────────────────────────
  const { data: cached } = await supabase
    .from('raiox_bio_respostas')
    .select('resultado')
    .eq('email', emailNorm)
    .maybeSingle();

  if (cached?.resultado) {
    return res.status(200).json({ resultado: cached.resultado, cached: true });
  }

  // ── Gerar análise com IA ─────────────────────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userMessage = `## PERFIL DO PROFISSIONAL
Nome: ${nome || 'Não informado'}
Bio atual do Instagram: ${bio_atual}
Instagram: ${instagram ? '@' + instagram.replace('@', '') : 'Não informado'}

## INFORMAÇÕES COMPLEMENTARES
- Nicho e atuação exata: ${nicho}
- Idade média do público atendido: ${idade_publico || 'Não informado'}
- O que os clientes dizem após o serviço (transformação entregue): ${transformacao || 'Não informado'}
- Elemento pessoal para humanizar a bio: ${pessoal || 'Não informado'}`;

  let resultado;
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      system: PROMPT_SISTEMA,
      messages: [{ role: 'user', content: userMessage }],
    });

    const raw = message.content[0].text.trim();
    // Extrai JSON mesmo que venha com markdown fence
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    resultado = JSON.parse(jsonStr);
  } catch (err) {
    console.error('AI parse error:', err);
    return res.status(500).json({ error: 'Falha ao processar análise. Tente novamente.' });
  }

  // Normalizar campos — a IA pode usar nomes com ou sem acento
  // notas: aceita "comunicação", "identificação", "clareza" ou sem acento
  if (resultado.notas) {
    const n = resultado.notas;
    resultado.notas = {
      comunicacao:  n.comunicacao  ?? n['comunicação']  ?? 5,
      identificacao: n.identificacao ?? n['identificação'] ?? 5,
      clareza:      n.clareza      ?? 5,
    };
  } else {
    resultado.notas = { comunicacao: 5, identificacao: 5, clareza: 5 };
  }
  // sugestoes: aceita "sugestoes" ou "sugestões"
  resultado.sugestoes = resultado.sugestoes ?? resultado['sugestões'] ?? [];
  // analise: aceita "analise" ou "análise"
  resultado.analise = resultado.analise ?? resultado['análise'] ?? '';
  // score_geral: calcula se ausente ou inválido
  if (!resultado.score_geral || typeof resultado.score_geral !== 'number') {
    const { comunicacao = 5, identificacao = 5, clareza = 5 } = resultado.notas;
    resultado.score_geral = Math.round(((comunicacao + identificacao + clareza) / 3) * 10) / 10;
  }

  // ── Salvar no Supabase ───────────────────────────────────────
  const { error: dbErr } = await supabase
    .from('raiox_bio_respostas')
    .upsert({
      email: emailNorm,
      nome: nome || null,
      bio_atual,
      instagram: instagram || null,
      idade_publico: idade_publico || null,
      transformacao: transformacao || null,
      nicho,
      pessoal: pessoal || null,
      resultado,
    }, { onConflict: 'email' });

  if (dbErr) console.error('Supabase error:', dbErr);

  // ── Enviar e-mail para o lead ────────────────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Raio-X da Bio <noreply@buzinadigital.com.br>',
      to: emailNorm,
      subject: `🎯 Seu Raio-X da Bio: nota ${resultado.score_geral.toFixed(1)} — Buzina Digital`,
      html: buildEmailHTML(nome, resultado),
    });
  } catch (emailErr) {
    console.error('Email lead error (non-fatal):', emailErr);
  }

  // ── Notificação interna para Buzina Digital ──────────────────
  // Env: NOTIFY_EMAIL — e-mail do dono que recebe o aviso
  if (process.env.NOTIFY_EMAIL) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Raio-X da Bio <noreply@buzinadigital.com.br>',
        to: process.env.NOTIFY_EMAIL,
        subject: `🔔 Novo Raio-X da Bio: ${nome || 'Lead'} (${emailNorm}) — nota ${resultado.score_geral.toFixed(1)}`,
        html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#0f172a;font-family:sans-serif;color:#f8fafc">
  <h2 style="margin:0 0 16px">🎯 Novo Raio-X da Bio</h2>
  <table style="border-collapse:collapse;font-size:14px">
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Nome</td><td>${nome || 'N/I'}</td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">E-mail</td><td>${emailNorm}</td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Instagram</td><td>${instagram ? '@' + instagram : 'N/I'}</td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Nicho</td><td>${nicho}</td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Score</td><td><strong style="color:#f0b429">${resultado.score_geral.toFixed(1)}</strong></td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Comunicação</td><td>${resultado.notas.comunicacao.toFixed(1)}</td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Identificação</td><td>${resultado.notas.identificacao.toFixed(1)}</td></tr>
    <tr><td style="color:#94a3b8;padding:4px 12px 4px 0">Clareza</td><td>${resultado.notas.clareza.toFixed(1)}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0">
  <p style="font-size:13px;color:#64748b">Buzina Digital — Raio-X da Bio</p>
</body></html>`,
      });
    } catch (notifyErr) {
      console.error('Notify email error (non-fatal):', notifyErr);
    }
  }

  // ── LeadLovers: captura via paginas.rocks/capture ───────────
  // Mesmo endpoint usado pelos formulários nativos da LeadLovers.
  // Env obrigatórias: LEADLOVERS_MACHINE_ID, LEADLOVERS_SEQUENCE_ID
  if (process.env.LEADLOVERS_MACHINE_ID && process.env.LEADLOVERS_SEQUENCE_ID) {
    try {
      const mid  = process.env.LEADLOVERS_MACHINE_ID;
      const pid  = process.env.LEADLOVERS_SEQUENCE_ID;

      const params = new URLSearchParams({
        id:       mid,
        mid:      mid,
        pid:      pid,
        list_id:  mid,
        provider: 'leadlovers',
        email:    emailNorm,
        name:     nome || '',
        source:   'raiox-bio',
      });

      const llRes = await fetch('https://paginas.rocks/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!llRes.ok) {
        const errText = await llRes.text();
        console.error('LeadLovers capture error:', llRes.status, errText);
      }
    } catch (llErr) {
      console.error('LeadLovers capture error (non-fatal):', llErr);
    }
  }

  return res.status(200).json({ resultado, cached: false });
}
