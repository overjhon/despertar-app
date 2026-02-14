// Geração de conteúdo com IA usando Lovable AI (Gemini 2.5 Flash)
// Para uso administrativo apenas - popular comunidade com conteúdo realista

class RateLimiter {
  private lastCallTime = 0;
  private minInterval: number;

  constructor(callsPerSecond: number = 2) {
    this.minInterval = 1000 / callsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    
    this.lastCallTime = Date.now();
  }
}

const rateLimiter = new RateLimiter(2); // 2 chamadas por segundo - mais conservador para evitar throttling

// Gerar post de comunidade com IA
export async function generateAIPost(
  lovableApiKey: string,
  userProfile: { name: string; bio: string }
): Promise<string> {
  await rateLimiter.throttle();

  const systemPrompt = `Você é ${userProfile.name}, uma artesã brasileira de velas.
Bio: ${userProfile.bio}

REGRAS CRÍTICAS:
- Escreva em português brasileiro informal
- Máximo 200 caracteres (1-2 frases curtas)
- Seja natural, não use clichês corporativos
- Varie o estilo: às vezes pergunta, às vezes dica, às vezes comemoração
- Use emojis brasileiros com moderação (🕯️ ✨ 💡 🎉 😅)
- Mencione marcas brasileiras: Mundo das Essências, Velas Brasil, fornecedores locais
- Use linguagem de WhatsApp: "gente", "galera", "pessoal"
- Números concretos quando mencionar vendas/produção

TEMAS (escolha 1):
• Dúvidas técnicas específicas
• Compartilhar resultado/conquista com números
• Pedir recomendação de fornecedor
• Dica rápida e prática
• Mostrar criação nova
• Problema comum + pedido de ajuda`;

  const userPrompt = `Escreva UM post curto (máx 200 caracteres) como ${userProfile.name}.

EXEMPLOS DO TOM:
- "Testei pavio de madeira hoje, ficou top! Alguém sabe onde comprar barato?"
- "Vendi 23 velas esse final de semana 🎉 tô feliz demais"
- "Como vocês evitam bolhas? Tá me tirando do sério 😅"
- "Dica: nunca colocar essência acima de 55°C, aprendi na prática"

Retorne APENAS o texto do post (sem aspas, sem formatação).`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erro ao gerar post com IA:', error);
    // Fallback para conteúdo estático
    const fallbacks = [
      "Alguém sabe onde comprar pavio de madeira barato?",
      "Vendi tudo que fiz esse mês! 🎉",
      "Como vocês fazem pra evitar rachaduras?",
      "Testei cera de soja hoje, adorei o resultado ✨"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

// Validação rigorosa de contexto
function validateContext(post: string, comment: string): boolean {
  const postWords = post.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const commentWords = comment.toLowerCase();
  
  // Extrair palavras-chave importantes do post (excluir stopwords)
  const keywords = postWords.filter(w => 
    !['fazer', 'como', 'onde', 'mais', 'essa', 'isso', 'para', 'pela', 'você', 'vocês', 'também', 'aqui'].includes(w)
  );
  
  // Pelo menos 1 palavra-chave do post deve aparecer no comentário
  const hasKeyword = keywords.some(kw => commentWords.includes(kw));
  
  // OU comentário deve ser uma pergunta relacionada
  const isQuestion = comment.includes('?') && comment.length > 20;
  
  // OU comentário menciona técnicas/materiais específicos
  const hasTechnique = /pavio|cera|essência|aroma|molde|temperatura|°C|derrete|rachad|bolha|cor|soja|abelha|gel|mármore|vela|vendi|lucr/i.test(comment);
  
  return hasKeyword || isQuestion || hasTechnique;
}

// Fallback contextual inteligente que analisa o post
export function generateContextualFallback(postContent: string): string {
  const post = postContent.toLowerCase();
  
  // PERGUNTAS sobre técnicas
  if (post.includes('?') && (post.includes('como') || post.includes('onde') || post.includes('alguém'))) {
    if (post.includes('pavio')) return 'Eu uso pavio de madeira da Mundo das Essências, dá super certo! 🔥';
    if (post.includes('cera')) return 'Eu trabalho com cera de soja, mas ouvi falar bem da abelha também!';
    if (post.includes('bolha') || post.includes('rachad')) return 'Tenta resfriar mais devagar, comigo resolveu!';
    if (post.includes('aroma') || post.includes('cheiro') || post.includes('essência')) return 'Eu uso 6-8% de essência na cera, segura bem o aroma 👌';
    if (post.includes('cor')) return 'Eu adiciono corante líquido aos poucos até acertar o tom!';
    if (post.includes('fornecedor') || post.includes('comprar')) return 'Eu compro na Mundo das Essências, qualidade top!';
    return 'Boa pergunta! Também quero saber 😊';
  }
  
  // PROBLEMAS técnicos
  if ((post.includes('não') || post.includes('😔') || post.includes('😅')) && 
      (post.includes('dá certo') || post.includes('funciona') || post.includes('consigo'))) {
    return 'Já passei por isso! Com o tempo a gente pega o jeito 💪';
  }
  
  // CONQUISTAS de vendas/lucro
  if (/vendi|lucrei|ganhei|cliente|pedido|R\$/i.test(post)) {
    const hasNumber = /\d+/.test(post);
    if (hasNumber) return 'Que show! 🎉 Conta mais, quais foram as mais vendidas?';
    return 'Parabéns! 🎉 Quanto tempo levou pra chegar nesse resultado?';
  }
  
  // TESTES/EXPERIMENTOS
  if (post.includes('testei') || post.includes('tentei') || post.includes('primeira vez') || post.includes('tentando')) {
    return 'Adorei a ideia! Vou tentar aqui também 😍';
  }
  
  // SATISFAÇÃO/RESULTADO
  if (post.includes('consegui') || post.includes('finalmente') || post.includes('ficou')) {
    return 'Ficou lindo! 💕 Qual técnica você usou?';
  }
  
  // TEMPO/PROCESSO
  if (post.includes('horas') || post.includes('tempo') || post.includes('valeu')) {
    return 'Dedicação vale a pena! Resultado top 👏';
  }
  
  // OPINIÕES/SENTIMENTOS
  if (post.includes('ama') || post.includes('amo') || post.includes('😍')) {
    return 'Também amo! É viciante demais 😍';
  }
  
  // Fallback genérico (apenas se nada acima corresponder)
  const randomFallbacks = [
    'Que legal! 👏',
    'Interessante! 🤔',
    'Boa! 😊',
  ];
  return randomFallbacks[Math.floor(Math.random() * randomFallbacks.length)];
}

// FASE 1: Gerar comentário CONTEXTUAL com IA
export async function generateAIComment(
  lovableApiKey: string,
  postContent: string,
  commenterName: string,
  hasRetried = false
): Promise<string> {
  await rateLimiter.throttle();
  
  console.log(`🤖 Gerando comentário para: "${postContent.slice(0, 50)}..."`);

  // PROMPT SIMPLIFICADO (90% de redução)
  const systemPrompt = `Você é ${commenterName}, uma artesã brasileira comentando naturalmente.

REGRAS:
1. Leia o post e responda ESPECIFICAMENTE sobre o conteúdo dele
2. Máximo 100 caracteres
3. Seja útil, empática ou encorajadora
4. Use linguagem informal brasileira`;

  const userPrompt = `Comente este post de forma útil e específica:

"${postContent}"

Seu comentário (máx 100 chars):`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9, // Aumentado para mais criatividade
        max_completion_tokens: 80, // Reduzido para forçar brevidade
      }),
    });

    if (!response.ok) {
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const comment = data.choices[0].message.content.trim();
    
    // Validação RIGOROSA de contexto
    const isValid = validateContext(postContent, comment);
    
    if (!isValid && !hasRetried) {
      console.warn(`⚠️ Comentário não contextual, tentando novamente...`);
      // Retry uma vez
      return await generateAIComment(lovableApiKey, postContent, commenterName, true);
    }
    
    if (!isValid) {
      console.warn(`❌ Comentário ainda não contextual após retry: "${comment}" - Usando fallback contextual`);
      return generateContextualFallback(postContent);
    }

    console.log(`✅ Comentário válido gerado`);
    return comment;
  } catch (error) {
    console.error(`❌ Erro na IA:`, error);
    return generateContextualFallback(postContent);
  }
}

// Gerar depoimento autêntico com IA
export async function generateAITestimonial(
  lovableApiKey: string,
  ebookTitle: string,
  userName: string
): Promise<{ title: string; content: string }> {
  await rateLimiter.throttle();

  const systemPrompt = `Você escreve depoimentos autênticos de artesãs brasileiras sobre e-books de velas.

REGRAS CRÍTICAS:
- Português brasileiro natural
- Título: máx 50 caracteres com resultado específico
- Conteúdo: 150-200 caracteres, estrutura problema→solução→resultado
- Use números reais: vendas, dias, percentuais, valores em R$
- Mencione técnicas específicas do e-book
- Tom: gratidão + empolgação genuína
- Evite clichês: "mudou minha vida", "super recomendo"
- Seja ESPECÍFICA e CONCRETA

ESTRUTURA:
1. Problema antes (1 frase)
2. O que o e-book ensinou (1 frase)
3. Resultado concreto (1 frase com números)`;

  const userPrompt = `E-book: "${ebookTitle}"
Autora: ${userName}

Gere um depoimento autêntico em JSON:

{
  "title": "Resultado específico em X dias",
  "content": "Problema concreto + solução do ebook + resultado com números"
}

EXEMPLO:
{
  "title": "Lucrei R$ 800 no primeiro mês",
  "content": "Gastava muito com material errado. As receitas do e-book me mostraram fornecedores melhores. Em 30 dias economizei 40% e dobrei as vendas."
}

Retorne APENAS o JSON (sem markdown).`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 250,
      }),
    });

    if (!response.ok) {
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('JSON não encontrado na resposta');
  } catch (error) {
    console.error('Erro ao gerar depoimento:', error);
    // Fallback
    return {
      title: 'Valeu muito a pena',
      content: `As técnicas de ${ebookTitle} me ajudaram muito. Aprendi truques que uso todos os dias. Minhas vendas melhoraram bastante!`
    };
  }
}
