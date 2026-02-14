import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import {
  generateUsers,
  generateGamificationData,
  generateTestimonials,
  generateCommunityPosts,
  generateEngagement,
  generateCreations,
  generateDailyStats,
  generateXPTransactions,
} from './generators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userCount = 50, cleanOldData = false } = await req.json();

    // Validate user count
    if (userCount < 5 || userCount > 50) {
      return new Response(
        JSON.stringify({ error: 'userCount must be between 5 and 50' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.warn('⚠️ LOVABLE_API_KEY não configurado, usando conteúdo de fallback');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`Starting seed process with ${userCount} users...`);

    // Clean old seed data if requested
    if (cleanOldData) {
      console.log('🗑️ Cleaning old seed data...');
      
      // Find seed users (those with @example.com emails)
      const { data: seedProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .like('email', '%@example.com');
      
      const seedUserIds = seedProfiles?.map(p => p.id) || [];
      
      if (seedUserIds.length > 0) {
        console.log(`Found ${seedUserIds.length} seed users to clean`);

        // Helper: chunk arrays to avoid very large IN queries
        const chunk = <T>(arr: T[], size = 500) => {
          const out: T[][] = [];
          for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
          return out;
        };

        // 1) Collect content IDs authored by seed users
        const [postsRes, testiRes, creationsRes] = await Promise.all([
          supabase.from('community_posts').select('id').in('user_id', seedUserIds),
          supabase.from('testimonials').select('id').in('user_id', seedUserIds),
          supabase.from('community_creations').select('id').in('user_id', seedUserIds),
        ]);

        const postIds = (postsRes.data?.map((r: { id: string }) => r.id) || []);
        const testimonialIds = (testiRes.data?.map((r: { id: string }) => r.id) || []);
        const creationIds = (creationsRes.data?.map((r: { id: string }) => r.id) || []);

        console.log(
          `Seed content -> posts: ${postIds.length}, testimonials: ${testimonialIds.length}, creations: ${creationIds.length}`
        );

        // 2) Delete dependencies that reference the content IDs (from any users)
        // Posts dependencies
        for (const ids of chunk(postIds)) {
          if (ids.length === 0) break;
          try {
            const { error: pcErr } = await supabase.from('post_comments').delete().in('post_id', ids);
            if (pcErr) console.error('Error deleting post_comments by post_id:', pcErr.message);
          } catch (e) { console.error('Exception deleting post_comments by post_id:', e); }
          try {
            const { error: plErr } = await supabase.from('post_likes').delete().in('post_id', ids);
            if (plErr) console.error('Error deleting post_likes by post_id:', plErr.message);
          } catch (e) { console.error('Exception deleting post_likes by post_id:', e); }
          try {
            const { error: cmErr } = await supabase
              .from('content_moderation')
              .delete()
              .in('content_id', ids)
              .in('content_type', ['community_post', 'post']);
            if (cmErr) console.warn('Warn deleting content_moderation for posts:', cmErr.message);
          } catch (e) { console.warn('Exception deleting content_moderation for posts:', e); }
        }

        // Testimonials dependencies
        for (const ids of chunk(testimonialIds)) {
          if (ids.length === 0) break;
          try {
            const { error } = await supabase.from('testimonial_comments').delete().in('testimonial_id', ids);
            if (error) console.error('Error deleting testimonial_comments:', error.message);
          } catch (e) { console.error('Exception deleting testimonial_comments:', e); }
          try {
            const { error } = await supabase.from('testimonial_likes').delete().in('testimonial_id', ids);
            if (error) console.error('Error deleting testimonial_likes:', error.message);
          } catch (e) { console.error('Exception deleting testimonial_likes:', e); }
          try {
            const { error } = await supabase.from('testimonial_media').delete().in('testimonial_id', ids);
            if (error) console.error('Error deleting testimonial_media:', error.message);
          } catch (e) { console.error('Exception deleting testimonial_media:', e); }
          try {
            const { error } = await supabase
              .from('content_moderation')
              .delete()
              .in('content_id', ids)
              .in('content_type', ['testimonial']);
            if (error) console.warn('Warn deleting content_moderation for testimonials:', error.message);
          } catch (e) { console.warn('Exception deleting content_moderation for testimonials:', e); }
        }

        // Creations dependencies
        for (const ids of chunk(creationIds)) {
          if (ids.length === 0) break;
          try {
            const { error } = await supabase.from('creation_likes').delete().in('creation_id', ids);
            if (error) console.error('Error deleting creation_likes:', error.message);
          } catch (e) { console.error('Exception deleting creation_likes:', e); }
          try {
            const { error } = await supabase
              .from('content_moderation')
              .delete()
              .in('content_id', ids)
              .in('content_type', ['creation', 'community_creation']);
            if (error) console.warn('Warn deleting content_moderation for creations:', error.message);
          } catch (e) { console.warn('Exception deleting content_moderation for creations:', e); }
        }

        // 3) Delete main content
        for (const ids of chunk(postIds)) {
          if (ids.length === 0) break;
          try {
            const { error } = await supabase.from('community_posts').delete().in('id', ids);
            if (error) console.error('Error deleting community_posts:', error.message);
          } catch (e) { console.error('Exception deleting community_posts:', e); }
        }
        for (const ids of chunk(testimonialIds)) {
          if (ids.length === 0) break;
          try {
            const { error } = await supabase.from('testimonials').delete().in('id', ids);
            if (error) console.error('Error deleting testimonials:', error.message);
          } catch (e) { console.error('Exception deleting testimonials:', e); }
        }
        for (const ids of chunk(creationIds)) {
          if (ids.length === 0) break;
          try {
            const { error } = await supabase.from('community_creations').delete().in('id', ids);
            if (error) console.error('Error deleting community_creations:', error.message);
          } catch (e) { console.error('Exception deleting community_creations:', e); }
        }

        // 4) Also remove the seed users' interactions on others' content
        const userScopedCleanup = [
          { name: 'post_comments', field: 'user_id' },
          { name: 'post_likes', field: 'user_id' },
          { name: 'testimonial_comments', field: 'user_id' },
          { name: 'testimonial_likes', field: 'user_id' },
          { name: 'creation_likes', field: 'user_id' },
        ];
        for (const table of userScopedCleanup) {
          for (const ids of chunk(seedUserIds)) {
            try {
              const { error } = await supabase.from(table.name).delete().in(table.field, ids);
              if (error) console.error(`Error deleting ${table.name} by ${table.field}:`, error.message);
            } catch (e) { console.error(`Exception deleting ${table.name} by ${table.field}:`, e); }
          }
        }

        // 5) Delete user-bound data (notifications, follows, gamification, etc.)
        const tablesByUserId = [
          // Notificações e subscriptions
          { name: 'notifications', field: 'user_id' },
          { name: 'push_subscriptions', field: 'user_id' },
          // Follows (bidirectional)
          { name: 'user_follows', field: 'follower_id' },
          { name: 'user_follows', field: 'following_id' },
          // Gamificação e progresso
          { name: 'user_badges', field: 'user_id' },
          { name: 'user_challenges', field: 'user_id' },
          { name: 'user_rewards', field: 'user_id' },
          { name: 'daily_reading_stats', field: 'user_id' },
          { name: 'user_gamification', field: 'user_id' },
          { name: 'user_progress', field: 'user_id' },
          // Compras e clicks
          { name: 'purchase_clicks', field: 'user_id' },
          { name: 'user_ebooks', field: 'user_id' },
        ];
        for (const table of tablesByUserId) {
          for (const ids of chunk(seedUserIds)) {
            try {
              const { error } = await supabase.from(table.name).delete().in(table.field, ids);
              if (error) console.error(`Error deleting from ${table.name}:`, error.message);
            } catch (e) { console.error(`Exception deleting from ${table.name}:`, e); }
          }
        }

        // 6) Delete public_profiles if any (defensive) then profiles
        for (const ids of chunk(seedUserIds)) {
          try {
            const { error } = await supabase.from('public_profiles').delete().in('id', ids);
            if (error) console.warn('Warn deleting from public_profiles:', error.message);
          } catch (e) { console.warn('Exception deleting from public_profiles:', e); }
        }
        for (const ids of chunk(seedUserIds)) {
          try {
            const { error } = await supabase.from('profiles').delete().in('id', ids);
            if (error) console.error('Error deleting from profiles:', error.message);
          } catch (e) { console.error('Exception deleting from profiles:', e); }
        }

        // 7) Delete auth users in batches (10 per batch)
        console.log('🔐 Deleting auth users...');
        const batchSize = 10;
        for (let i = 0; i < seedUserIds.length; i += batchSize) {
          const batch = seedUserIds.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (userId) => {
              try {
                await supabase.auth.admin.deleteUser(userId);
              } catch (err) {
                console.error(`⚠️ Error deleting auth user ${userId}:`, err);
              }
            })
          );
          console.log(`✅ Deleted auth users ${i + 1}-${Math.min(i + batchSize, seedUserIds.length)}/${seedUserIds.length}`);
        }

        console.log(`✅ Cleanup completed for ${seedUserIds.length} seed users`);
      } else {
        console.log('No seed users found to clean');
      }
    }

    // Get existing ebooks with titles for AI context
    const { data: ebooks, error: ebooksError } = await supabase
      .from('ebooks')
      .select('id, title')
      .eq('is_active', true)
      .limit(20);

    if (ebooksError || !ebooks || ebooks.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No active ebooks found. Please add ebooks before seeding data.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${ebooks.length} ebooks for AI context`);

    // Step 1: Generate users
    console.log('Generating users...');
    const users = await generateUsers(supabase, userCount);
    console.log(`Created ${users.length} users`);

    // Step 2: Generate gamification data
    console.log('Generating gamification data...');
    await generateGamificationData(supabase, users);
    console.log('Gamification data created');

    // Step 3: Generate testimonials with AI
    console.log('✨ Gerando depoimentos com Lovable AI...');
    await generateTestimonials(supabase, users, ebooks, lovableApiKey);
    console.log('✅ Depoimentos criados');

    // Step 4: Generate community posts with AI
    console.log('✨ Gerando posts com Lovable AI...');
    const startTime = Date.now();
    const postIds = await generateCommunityPosts(supabase, users, lovableApiKey);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Criados ${postIds.length} posts em ${elapsed}s`);

    // Step 5: Generate engagement with AI comments
    console.log('✨ Gerando comentários com Lovable AI...');
    await generateEngagement(supabase, users, postIds, lovableApiKey);
    console.log('✅ Engajamento criado');

    // Step 6: Generate creations
    console.log('Generating user creations...');
    const ebookIds = ebooks.map(e => e.id);
    await generateCreations(supabase, users, ebookIds);
    console.log('User creations created');

    // Step 7: Generate daily reading stats (last 30 days)
    console.log('📊 Generating daily reading stats (30 days)...');
    await generateDailyStats(supabase, users);
    console.log('✅ Daily stats created');

    // Step 8: Generate XP transactions for rankings
    console.log('💰 Generating XP transactions...');
    await generateXPTransactions(supabase, users);
    console.log('✅ XP transactions created');

    const summary = {
      success: true,
      data: {
        users_created: users.length,
        ebooks_referenced: ebookIds.length,
        posts_created: postIds.length,
        message: 'Database seeded successfully with realistic demo data',
        note: 'All users have password: demo123456',
      },
    };

    console.log('Seed process completed successfully');

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
