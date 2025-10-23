<template>
<div class="flex flex-col" :class="isReportPage ? 'w-full min-h-screen' : 'container mx-auto gap-6 max-w-2xl'">
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
      // Check if current route is a report page
      const path = this.$route.path
      return path.includes('/report') || path.includes('/chooseReport') || path.includes('/ProductsPage')
    }
  }
}
</script>
