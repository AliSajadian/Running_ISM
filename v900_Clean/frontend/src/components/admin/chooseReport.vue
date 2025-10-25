<script>
import Card from '@/components/Card.vue'

export default {
  name: "chooseReport",
  components: {
    Card,
  },
  data() {
    return {
      selectedReport: '',
      reports: [
        { name: 'گزارش بارنامه', value: 'shipment' },
        { name: 'گزارش فروش', value: 'sales' },
        { name: 'گزارش خرید', value: 'purchases' },
        { name: 'گزارش محصولات', value: 'products' },
        { name: 'گزارش مواد اولیه', value: 'rawMaterial' },
        { name: 'گزارش مصرف', value: 'consumption' },
        { name: 'گزارش هشدارها', value: 'alerts' }
      ]
    }
  },
  methods: {
    displayReport() {
      if (this.selectedReport) {
        // this.showReport = true

        // Navigate to the specific report route instead of showing it as a child component
        this.$router.push(`/myapp/${this.selectedReport}Report/`)
      }
    },
  }
}
</script>

<template>
  <!-- Selection Card with full width -->
  <div class="w-full">
    <Card title="انتخاب گزارش">
      <div class="flex flex-col gap-4 items-center justify-center p-4">
        <!-- Dropdown - much wider now -->
        <div class="w-full">
          <label for="report-select" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            انتخاب نوع گزارش
          </label>
          <select 
            id="report-select"
            v-model="selectedReport"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500"
          >
            <option value="" disabled selected>یک گزارش را انتخاب کنید</option>
            <option 
              v-for="report in reports" 
              :key="report.value" 
              :value="report.value"
            >
              {{ report.name }}
            </option>
          </select>
        </div>

        <!-- Show Report Button -->
        <button
          @click="displayReport"
          :disabled="!selectedReport"
          type="button"
          class="w-44 text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          نمایش گزارش
        </button>

        <!-- Back Button -->
        <router-link
          to="/myapp/"
          type="button"
          class="w-44 block text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
        >
          بازگشت
        </router-link>
      </div>
    </Card>
  </div>
</template>

<style scoped>
/* No additional styles needed */
</style>

