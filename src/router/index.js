import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // Public routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('../views/AuthCallbackPage.vue'),
    meta: { public: true },
  },

  // Protected routes
  {
    path: '/',
    name: 'Home',
    redirect: '/parties',
  },
  {
    path: '/parties',
    name: 'MyParties',
    component: () => import('../views/MyPartiesPage.vue'),
  },
  {
    path: '/create',
    name: 'CreateParty',
    component: () => import('../views/CreatePartyPage.vue'),
  },
  {
    path: '/join/:code?',
    name: 'JoinParty',
    component: () => import('../views/JoinPartyPage.vue'),
    meta: { public: true }, // Allow unauthenticated users to see join page
  },
  {
    path: '/party/:id',
    name: 'PartyDashboard',
    component: () => import('../views/PartyDashboardPage.vue'),
  },
  {
    path: '/party/:id/draw',
    name: 'DrawPage',
    component: () => import('../views/DrawPage.vue'),
  },
  {
    path: '/party/:id/member/:memberId',
    name: 'MemberProfile',
    component: () => import('../views/MemberProfilePage.vue'),
  },
  {
    path: '/party/:id/my-profile',
    name: 'MyPartyProfile',
    component: () => import('../views/MyPartyProfilePage.vue'),
  },

  // Legacy routes (redirect old URLs)
  {
    path: '/event/:id',
    redirect: to => ({ name: 'PartyDashboard', params: { id: to.params.id } }),
  },
  {
    path: '/event/:id/draw',
    redirect: to => ({ name: 'DrawPage', params: { id: to.params.id } }),
  },

  // Catch-all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/parties',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard - import store inside guard to ensure Pinia is ready
router.beforeEach(async (to, from, next) => {
  const { useUserStore } = await import('@/stores/userStore')
  const userStore = useUserStore()

  // Wait for auth to initialize if needed
  if (userStore.isLoading) {
    await new Promise(resolve => {
      const unwatch = userStore.$subscribe((mutation, state) => {
        if (!state.isLoading) {
          unwatch()
          resolve()
        }
      })
      // Timeout fallback
      setTimeout(() => {
        unwatch()
        resolve()
      }, 3000)
    })
  }

  const isPublicRoute = to.meta.public
  const isAuthenticated = userStore.isAuthenticated

  if (!isAuthenticated && !isPublicRoute) {
    // Save intended destination for after login
    if (to.name === 'JoinParty' && to.params.code) {
      sessionStorage.setItem('pendingJoinCode', to.params.code)
    }
    next({ name: 'Login', query: to.params.code ? { join: to.params.code } : {} })
  } else if (isAuthenticated && to.name === 'Login') {
    next({ name: 'MyParties' })
  } else {
    next()
  }
})

export default router
