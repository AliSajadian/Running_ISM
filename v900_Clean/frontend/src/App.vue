<template>
  <div class="flex flex-col" :class="pageClass">
    <main v-if="!isReportPage" class="flex flex-col justify-center items-center p-5">
      <router-view/>
    </main>
    <router-view v-else/>
  </div>
  </template>
  
  <script>
  export default {
    computed: {
      isReportPage() {
        const path = this.$route.path
        return (path.includes('Report') || path.includes('/ProductsPage')) && !path.includes('/chooseReport')
      },
      pageClass() {
        const path = this.$route.path
        // Full width for report pages
        if (this.isReportPage) {
          return 'w-full min-h-screen'
        }
        // Wider width for chooseReport
        if (path.includes('/chooseReport')) {
          return 'container mx-auto gap-6 max-w-3xl'
        }
        // Default narrow width for other pages
        return 'container mx-auto gap-6 max-w-2xl'
      }
    }
  }
  </script>