const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://wpnlogipuoegpdomhupw.supabase.co'
// Use service role key for admin operations (get from Supabase Dashboard → Settings → API → service_role)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable')
  console.log('\nTo get your service role key:')
  console.log('1. Go to Supabase Dashboard → Settings → API')
  console.log('2. Copy the "service_role" key (NOT the anon key)')
  console.log('3. Run: SUPABASE_SERVICE_KEY=your-key node scripts/setup-db.cjs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🔧 Givt Database Setup\n')

  // Check for users without profiles
  console.log('Checking for users without profiles...')

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message)
    return
  }

  console.log(`Found ${users.users.length} user(s) in auth.users`)

  for (const user of users.users) {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log(`\n📝 Creating profile for: ${user.email}`)

      const displayName = user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email?.split('@')[0] ||
                          'User'

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          display_name: displayName,
          avatar_emoji: '🎁'
        })

      if (insertError) {
        console.error(`❌ Failed to create profile: ${insertError.message}`)
      } else {
        console.log(`✅ Profile created for ${displayName}`)
      }
    } else if (profile) {
      console.log(`✓ Profile exists for: ${user.email}`)
    }
  }

  console.log('\n✅ Done!')
}

main().catch(console.error)
