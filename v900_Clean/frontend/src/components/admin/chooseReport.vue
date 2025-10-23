<script>
import Card from '@/components/Card.vue'
import shipmentReport from './reports/shipmentReport.vue'
import salesReport from './reports/salesReport.vue'
import purchasesReport from './reports/purchasesReport.vue'
import ProductsReport from './reports/ProductsReport.vue'
import rawMaterialReport from './reports/rawMaterialReport.vue'
import consumptionReport from './reports/consumptionReport.vue'
import alertsReports from './reports/alertsReports.vue'

export default {
  name: "chooseReport",
  components: {
    Card,
    shipmentReport,
    salesReport,
    purchasesReport,
    ProductsReport,
    rawMaterialReport,
    consumptionReport,
    alertsReports
  },
  data() {
    return {
      selectedReport: '',
      showReport: false,
      reports: [
        { name: 'گزارش بارنامه', value: 'shipment', component: 'shipmentReport' },
        { name: 'گزارش فروش', value: 'sales', component: 'salesReport' },
        { name: 'گزارش خرید', value: 'purchases', component: 'purchasesReport' },
        { name: 'گزارش محصولات', value: 'products', component: 'ProductsReport' },
        { name: 'گزارش مواد اولیه', value: 'rawMaterial', component: 'rawMaterialReport' },
        { name: 'گزارش مصرف', value: 'consumption', component: 'consumptionReport' },
        { name: 'گزارش هشدارها', value: 'alerts', component: 'alertsReports' }
      ]
    }
  },
  computed: {
    selectedReportComponent() {
      const report = this.reports.find(r => r.value === this.selectedReport)
      return report ? report.component : null
    }
  },
  methods: {
    displayReport() {
      if (this.selectedReport) {
        this.showReport = true
      }
    },
    resetReport() {
      this.showReport = false
      this.selectedReport = ''
    }
  }
}
</script>

<template>
  <!-- Selection Card with centered layout -->
  <div v-if="!showReport">
    <Card title="انتخاب گزارش">
      <div class="flex flex-col gap-4 items-center justify-center p-4">
        <!-- Dropdown -->
        <div class="w-full max-w-md">
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

  <!-- Display Selected Report - NO wrapper, direct component -->
  <div v-if="showReport" class="w-full min-h-screen">
    <!-- Back Button - Fixed position -->
    <div class="fixed top-4 left-4 z-50">
      <button
        @click="resetReport"
        type="button"
        class="text-white bg-gray-500 hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
      >
        ← بازگشت به انتخاب گزارش
      </button>
    </div>

    <!-- Dynamic Component - Full width, no constraints -->
    <component :is="selectedReportComponent" />
  </div>
</template>

<style scoped>
/* No additional styles needed */
</style>

