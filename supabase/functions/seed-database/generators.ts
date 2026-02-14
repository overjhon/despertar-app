import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import {
  firstNamesMale,
  firstNamesFemale,
  lastNames,
  bioTemplates,
  creationTitles,
  creationDescriptions,
  randomChoice,
  randomChoices,
  randomInt,
  randomDate,
  sanitizeForEmail,
} from './data.ts';
import { 
  generateRealisticPost, 
  generateRealisticTestimonial,
  generateRealisticComment 
} from './realistic-content.ts';
import {
  generateAIPost,
  generateAIComment,
  generateAITestimonial,
  generateContextualFallback
} from './ai-generator.ts';

interface GeneratedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  bio: string;
}

export async function generateUsers(
  supabase: SupabaseClient,
  count: number
): Promise<GeneratedUser[]> {
  const users: GeneratedUser[] = [];
  const usedEmails = new Set<string>();

  // Avatares fotográficos reais do pravatar.cc (IDs validados por gênero)
  const malePhotoIds = [
    12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 
    26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 
    40, 46, 52, 54, 56, 58, 59, 60, 68, 69, 70
  ];
  
  const femalePhotoIds = [
    1, 5, 6, 8, 9, 10, 11, 24, 25, 36, 38, 39, 
    41, 42, 43, 44, 45, 47, 48, 49, 50, 51, 53, 
    55, 57, 61, 62, 63, 64, 65, 66, 67, 71
  ];

  for (let i = 0; i < count; i++) {
    // Randomly choose gender
    const useMale = Math.random() > 0.5;
    const firstName = randomChoice(useMale ? firstNamesMale : firstNamesFemale);
    const lastName = randomChoice(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    // Generate unique email
    let email: string;
    let attempts = 0;
    do {
      const randomNum = randomInt(100, 9999);
      email = `${sanitizeForEmail(firstName)}.${sanitizeForEmail(lastName)}${randomNum}@example.com`;
      attempts++;
    } while (usedEmails.has(email) && attempts < 100);
    
    usedEmails.add(email);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError || !authData.user) {
      console.warn(`Error creating user ${email}:`, authError);
      continue;
    }

    const userId = authData.user.id;
    
    // Gerar hash determinístico do nome para ID de avatar consistente
    const generateAvatarId = (name: string): number => {
      let hash = 5381;
      for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) + hash) + name.charCodeAt(i);
      }
      return Math.abs(hash) % 100;
    };
    
    const avatarId = generateAvatarId(fullName);
    const gender = useMale ? 'men' : 'women';
    const avatarUrl = `https://randomuser.me/api/portraits/${gender}/${avatarId}.jpg`;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        avatar_url: avatarUrl,
        bio: randomChoice(bioTemplates),
        email: email,
      })
      .eq('id', userId);

    if (profileError) {
      console.error(`Error updating profile for ${email}:`, profileError);
    }

    users.push({
      id: userId,
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
      bio: randomChoice(bioTemplates),
    });
  }

  return users;
}

export async function generateGamificationData(
  supabase: SupabaseClient,
  users: GeneratedUser[]
): Promise<void> {
  const activityLevels = ['low', 'medium', 'high'];
  
  for (const user of users) {
    const activity = randomChoice(activityLevels);
    
    let totalXp: number;
    let totalPages: number;
    let booksCompleted: number;
    let currentStreak: number;
    
    if (activity === 'high') {
      totalXp = randomInt(5000, 20000);
      totalPages = randomInt(1000, 5000);
      booksCompleted = randomInt(10, 30);
      currentStreak = randomInt(7, 60);
    } else if (activity === 'medium') {
      totalXp = randomInt(1000, 5000);
      totalPages = randomInt(300, 1000);
      booksCompleted = randomInt(3, 10);
      currentStreak = randomInt(2, 15);
    } else {
      totalXp = randomInt(0, 1000);
      totalPages = randomInt(50, 300);
      booksCompleted = randomInt(0, 3);
      currentStreak = randomInt(0, 5);
    }

    const currentLevel = Math.min(7, Math.floor(totalXp / 1500) + 1);
    const longestStreak = currentStreak + randomInt(0, 20);

    const { error } = await supabase.from('user_gamification').upsert({
      user_id: user.id,
      total_xp: totalXp,
      current_level: currentLevel,
      current_streak_days: currentStreak,
      longest_streak_days: longestStreak,
      pages_read_today: randomInt(0, 50),
      total_pages_read: totalPages,
      books_completed: booksCompleted,
      total_reading_time_minutes: totalPages * randomInt(2, 5),
      last_read_date: new Date().toISOString().split('T')[0],
    });

    if (error) {
      console.error(`Error creating gamification for user ${user.id}:`, error);
    }
  }
}

export async function generateTestimonials(
  supabase: SupabaseClient,
  users: GeneratedUser[],
  ebooks: Array<{id: string, title: string}>,
  lovableApiKey?: string
): Promise<void> {
  const testimonials = [];
  const useAI = !!lovableApiKey;
  
  console.log(`📝 Gerando depoimentos ${useAI ? 'com Lovable AI 🤖' : 'com templates'}...`);
  
  // FASE 3: Gerar mais depoimentos (60% dos usuários, alguns com múltiplos)
  for (const ebook of ebooks) {
    const testimonialsPerEbook = randomInt(8, 15); // Aumentado de 5-10 para 8-15
    const selectedUsers = randomChoices(users, Math.min(testimonialsPerEbook, users.length));
    
    for (const user of selectedUsers) {
      let title: string;
      let content: string;
      
      // Distribuição realista de ratings
      const ratingRandom = Math.random();
      let rating: number;
      if (ratingRandom < 0.50) rating = 5; // 50% → 5 estrelas
      else if (ratingRandom < 0.80) rating = 4; // 30% → 4 estrelas
      else if (ratingRandom < 0.95) rating = 3; // 15% → 3 estrelas
      else rating = 2; // 5% → 2 estrelas
      
      if (useAI) {
        try {
          const aiTestimonial = await generateAITestimonial(
            lovableApiKey!,
            ebook.title,
            user.full_name
          );
          title = aiTestimonial.title;
          content = aiTestimonial.content;
        } catch (error) {
          console.warn(`⚠️ AI failed for testimonial, using fallback`);
          const fallback = generateRealisticTestimonial(ebook.title);
          title = fallback.title;
          content = fallback.content;
        }
      } else {
        const realistic = generateRealisticTestimonial(ebook.title);
        title = realistic.title;
        content = realistic.content;
      }
      
      testimonials.push({
        user_id: user.id,
        ebook_id: ebook.id,
        title,
        content,
        rating,
        is_public: true, // SEMPRE público para aparecer na comunidade
      });
    }
  }
  
  // Alguns usuários ativos deixam múltiplos depoimentos (em ebooks diferentes)
  const activeReviewers = randomChoices(users, Math.floor(users.length * 0.15)); // 15% dos usuários
  for (const reviewer of activeReviewers) {
    const additionalEbook = randomChoice(ebooks);
    const realistic = generateRealisticTestimonial(additionalEbook.title);
    
    testimonials.push({
      user_id: reviewer.id,
      ebook_id: additionalEbook.id,
      title: realistic.title,
      content: realistic.content,
      rating: randomInt(4, 5),
      is_public: true, // SEMPRE público
    });
  }
  
  if (testimonials.length > 0) {
    const { error } = await supabase
      .from('testimonials')
      .insert(testimonials);
    
    if (error) {
      console.error('Error inserting testimonials:', error);
    } else {
      console.log(`✅ ${testimonials.length} depoimentos criados`);
    }
  }
}

export async function generateCommunityPosts(
  supabase: SupabaseClient,
  users: GeneratedUser[],
  openAiKey?: string
): Promise<string[]> {
  const posts = [];
  const postIds: string[] = [];
  const useAI = !!openAiKey;
  
  console.log(`📝 Gerando posts ${useAI ? 'com OpenAI 🤖' : 'com templates'}...`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const postsCount = randomInt(3, 7);
    
    for (let j = 0; j < postsCount; j++) {
      let content: string;
      
      if (useAI) {
        try {
          content = await generateAIPost(openAiKey!, {
            name: user.full_name,
            bio: user.bio
          });
        } catch (error) {
          console.warn(`⚠️ AI failed for ${user.full_name}, using fallback`);
          content = generateRealisticPost();
        }
      } else {
        content = generateRealisticPost();
      }
      
      const createdAt = randomDate(new Date(2024, 0, 1), new Date());
      posts.push({
        user_id: user.id,
        content,
        post_type: 'text',
        is_public: true,
        created_at: createdAt.toISOString(),
      });
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/${users.length} usuários processados`);
    }
  }
  
  // Inserir posts em batches
  const batchSize = 100;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('community_posts')
      .insert(batch)
      .select('id');
    
    if (error) {
      console.error('Error inserting posts:', error);
    } else if (data) {
      postIds.push(...data.map(p => p.id));
    }
  }
  
  console.log(`✅ ${postIds.length} posts criados`);
  return postIds;
}

export async function generateEngagement(
  supabase: SupabaseClient,
  users: GeneratedUser[],
  postIds: string[],
  openAiKey?: string
): Promise<void> {
  // Generate follows
  for (const user of users) {
    const followCount = randomInt(3, 15);
    const toFollow = randomChoices(
      users.filter(u => u.id !== user.id),
      followCount
    );

    for (const followed of toFollow) {
      await supabase.from('user_follows').insert({
        follower_id: user.id,
        following_id: followed.id,
      }).select().single();
    }
  }

  // Generate post likes em batch
  const likesToInsert = [];
  for (const postId of postIds) {
    const likesCount = randomInt(5, 30);
    const likers = randomChoices(users, likesCount);

    for (const liker of likers) {
      likesToInsert.push({
        post_id: postId,
        user_id: liker.id,
      });
    }
  }
  
  // Inserir likes em batches
  const batchSize = 100;
  for (let i = 0; i < likesToInsert.length; i += batchSize) {
    const batch = likesToInsert.slice(i, i + batchSize);
    await supabase.from('post_likes').insert(batch);
  }

  // Gerar comentários com IA contextual
  const useAI = !!openAiKey;
  console.log(`💬 Gerando comentários ${useAI ? 'com OpenAI 🤖' : 'com templates'}...`);
  
  const commentsToInsert = [];
  
  // Buscar conteúdo dos posts para contexto (em batches)
  const POST_BATCH_SIZE = 50;
  for (let i = 0; i < postIds.length; i += POST_BATCH_SIZE) {
    const postBatch = postIds.slice(i, i + POST_BATCH_SIZE);
    
    const { data: postsData } = await supabase
      .from('community_posts')
      .select('id, content')
      .in('id', postBatch);
    
    if (!postsData) continue;
    
    for (const post of postsData) {
      // Distribuição realista: 30% sem comentários, 40% com 1-3, 30% com 4-10 (viral)
      const rand = Math.random();
      let commentsCount = 0;
      if (rand > 0.3 && rand <= 0.7) {
        commentsCount = randomInt(1, 3); // 1-3 comentários
      } else if (rand > 0.7) {
        commentsCount = randomInt(4, 10); // 4-10 comentários (viral)
      }
      
      if (commentsCount === 0) continue;
      
      // Filtrar autor do post para garantir que comentários sejam de OUTROS usuários
      const { data: postWithAuthor } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', post.id)
        .single();
      
      const eligibleCommenters = users.filter(u => u.id !== postWithAuthor?.user_id);
      const commenters = randomChoices(eligibleCommenters, Math.min(commentsCount, eligibleCommenters.length));
      
      for (const commenter of commenters) {
        let commentContent: string;
        
        if (useAI) {
          try {
            console.log(`🤖 Gerando comentário IA para post: "${post.content.slice(0, 40)}..."`);
            commentContent = await generateAIComment(
              openAiKey!,
              post.content,
              commenter.full_name
            );
          } catch (error) {
            console.warn('Falha na IA, usando fallback contextual:', error);
            commentContent = generateContextualFallback(post.content);
          }
        } else {
          commentContent = generateContextualFallback(post.content);
        }
        
        commentsToInsert.push({
          post_id: post.id,
          user_id: commenter.id,
          content: commentContent,
        });
      }
    }
    
    if ((i + POST_BATCH_SIZE) % 100 === 0) {
      console.log(`  ✓ ${Math.min(i + POST_BATCH_SIZE, postIds.length)}/${postIds.length} posts processados`);
    }
    
    // Rate limit: 500ms entre batches de comentários (mais conservador)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Inserir comentários em batches
  for (let i = 0; i < commentsToInsert.length; i += batchSize) {
    const batch = commentsToInsert.slice(i, i + batchSize);
    await supabase.from('post_comments').insert(batch);
  }
  
  console.log(`✅ ${commentsToInsert.length} comentários criados`);
}

export async function generateCreations(
  supabase: SupabaseClient,
  users: GeneratedUser[],
  ebookIds: string[]
): Promise<void> {
  const creativeUsers = randomChoices(users, Math.floor(users.length * 0.3));

  for (const user of creativeUsers) {
    const creationsCount = randomInt(1, 3);
    
    for (let i = 0; i < creationsCount; i++) {
      const imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${user.id}-${i}`;
      
      const { error } = await supabase.from('community_creations').insert({
        user_id: user.id,
        title: randomChoice(creationTitles),
        description: randomChoice(creationDescriptions),
        image_url: imageUrl,
        ebook_id: randomChoice(ebookIds),
        difficulty: randomChoice(['easy', 'medium', 'hard']),
        is_featured: Math.random() > 0.8,
      });

      if (error) {
        console.error(`Error creating creation:`, error);
      }
    }
  }
}

// FASE 4: Generate daily reading stats for the last 30 days + GARANTIR DADOS DE HOJE
export async function generateDailyStats(
  supabase: SupabaseClient,
  users: GeneratedUser[]
): Promise<void> {
  console.log('📊 Gerando estatísticas diárias (últimos 30 dias + hoje)...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = [];
  
  // CRÍTICO: 80% dos usuários devem ter dados de HOJE (para aparecer no ranking diário)
  const activeToday = randomChoices(users, Math.floor(users.length * 0.8));
  const activeTodaySet = new Set(activeToday.map(u => u.id));
  
  for (const user of users) {
    // Generate stats for last 30 days
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      
      // Usuários ativos hoje têm dados mais robustos
      const isActiveTodayUser = activeTodaySet.has(user.id);
      
      // Dia atual (daysAgo === 0)
      if (daysAgo === 0) {
        // Somente usuários ativos hoje têm dados
        if (isActiveTodayUser) {
          const pagesRead = randomInt(20, 80); // 20-80 páginas hoje
          const xpEarned = pagesRead * 10;
          
          stats.push({
            user_id: user.id,
            date: date.toISOString().split('T')[0],
            pages_read: pagesRead,
            xp_earned: xpEarned,
            reading_time_minutes: randomInt(30, 180),
            books_completed: Math.random() > 0.9 ? 1 : 0,
          });
        }
      } else {
        // Dias anteriores: todos os usuários têm algum histórico (mas variável)
        const activityChance = isActiveTodayUser ? 0.8 : 0.5; // Usuários ativos leem mais frequentemente
        
        if (Math.random() < activityChance) {
          const pagesRead = randomInt(5, 50);
          const xpEarned = pagesRead * 10;
          
          stats.push({
            user_id: user.id,
            date: date.toISOString().split('T')[0],
            pages_read: pagesRead,
            xp_earned: xpEarned,
            reading_time_minutes: randomInt(15, 120),
            books_completed: Math.random() > 0.95 ? 1 : 0,
          });
        }
      }
    }
  }
  
  // Insert em batch
  const batchSize = 100;
  for (let i = 0; i < stats.length; i += batchSize) {
    const batch = stats.slice(i, i + batchSize);
    const { error } = await supabase.from('daily_reading_stats').insert(batch);
    if (error) {
      console.warn(`Error creating daily stats batch:`, error);
    }
  }
  
  console.log(`✅ ${stats.length} estatísticas diárias criadas para ${users.length} usuários`);
}

// FASE 4: Generate XP transactions RECENTES para rankings semanais/mensais
export async function generateXPTransactions(
  supabase: SupabaseClient,
  users: GeneratedUser[]
): Promise<void> {
  console.log('💰 Gerando transações de XP (últimos 30 dias)...');
  
  const now = new Date();
  const transactions = [];
  
  const xpReasons = [
    'Página lida',
    'Comentário na comunidade',
    'Post criado',
    'Depoimento enviado',
    'Sequência de leitura mantida',
    'Livro completado',
    'Curtida recebida',
  ];
  
  for (const user of users) {
    // Cada usuário tem 10-30 dias ativos no último mês
    const daysActive = randomInt(10, 30);
    
    for (let day = 0; day < daysActive; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // 2-5 transações por dia ativo
      const dailyTransactions = randomInt(2, 5);
      
      for (let i = 0; i < dailyTransactions; i++) {
        // Horários distribuídos ao longo do dia
        const hour = randomInt(8, 23); // 8h às 23h
        const minute = randomInt(0, 59);
        date.setHours(hour, minute, 0, 0);
        
        transactions.push({
          user_id: user.id,
          xp_amount: randomInt(5, 50),
          reason: randomChoice(xpReasons),
          created_at: date.toISOString(),
        });
      }
    }
  }
  
  // Inserir em batches de 500
  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    const { error } = await supabase.from('xp_transactions').insert(batch);
    
    if (error) {
      console.warn(`Error creating XP transactions batch:`, error);
    }
  }
  
  console.log(`✅ ${transactions.length} transações de XP criadas`);
  
  // CRITICAL: Atualizar total_xp de cada usuário com base nas transações geradas
  console.log('🔄 Recalculando total_xp dos usuários...');
  for (const user of users) {
    const { data: userTransactions } = await supabase
      .from('xp_transactions')
      .select('xp_amount')
      .eq('user_id', user.id);
    
    if (userTransactions && userTransactions.length > 0) {
      const totalXP = userTransactions.reduce((sum, t) => sum + t.xp_amount, 0);
      
      await supabase
        .from('user_gamification')
        .update({ total_xp: totalXP })
        .eq('user_id', user.id);
    }
  }
  
  console.log('✅ total_xp atualizado para todos os usuários');
}

