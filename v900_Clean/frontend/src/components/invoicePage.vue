<script>
import {initFlowbite} from 'flowbite'
import Card from '@/components/Card'
import modal from "@/components/Modal.vue";
import Alert from "@/components/Alert.vue";
import Lic_numer from "@/components/lic_numer.vue";
import {jsPDF} from "jspdf";
import html2canvas from 'html2canvas';
import StockTransferVoucher from '@/components/stockTransferVoucher.vue';

export default {
  name: "invoicePage", 
  components: {
    Lic_numer,
    Card,
    modal,
    Alert,
    StockTransferVoucher
  },
  data() {
    return {
      forms: {
        sales: {
          type: 'input',
          title: 'لیست فروش',
          data: [],
          value: '',
          fields: [],
          CopyData: [],
          searchQuery: ''
        },
      },
      pagination: {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrevious: false,
      },
      selectedSale: null,
      selectedRowIndex: null,
      alerts: [],
      alertSocket: null,
      showStockTransferModal: false,
      stockTransferSaleId: null,
    }
  },
  mounted() {
    initFlowbite();
    // this.load_data()
    this.fetchSalesPage();
    // Initialize WebSocket connection
    this.alertSocket = new WebSocket('ws://' + window.location.host + '/ws/alert/');

    // Set up message handler
    this.alertSocket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      this.update_alert({ message: data.message, payload: data.data })
    };

    // Handle WebSocket errors
    this.alertSocket.onerror = (error) => {
      console.error('WebSocket Error: ', error);
    };

  },
  beforeDestroy() {
    // Close WebSocket connection when component is destroyed
    if (this.alertSocket) {
      this.alertSocket.close();
    }
  },
  methods: {
    update_alert(payload) {
      if (!payload) {
        return;
      }
      const { message = '' } = payload
      if (message) {
        this.alerts.unshift({ message })
      }
    },
    async fetchSalesPage(page = 1) {
    try {
      this.pagination.page = page;

      const params = {
        page: this.pagination.page,
        page_size: this.pagination.pageSize,
      };

      const { data } = await this.axios.get('/myapp/api/getSalesData', { params });
      const { values = [], fields = [], pagination = {} } = data;

      this.forms.sales.data = values;
      this.forms.sales.CopyData = values;
      this.forms.sales.fields = fields;

      this.pagination = {
        page: pagination.page ?? page,
        pageSize: pagination.page_size ?? this.pagination.pageSize,
        totalPages: pagination.total_pages ?? 1,
        totalItems: pagination.total_items ?? values.length,
        hasNext: pagination.has_next ?? false,
        hasPrevious: pagination.has_previous ?? false,
      };

      if (!values.length) {
        this.selectedSale = null;
        this.selectedRowIndex = null;
        this.stockTransferSaleId = null;
      } else if (
        this.selectedRowIndex === null ||
        this.selectedRowIndex >= values.length
      ) {
        this.handleSelection(0, values[0]);
      }
    } catch (error) {
      console.error('Error fetching sales invoice data:', error);
      this.forms.sales.data = [];
      this.forms.sales.CopyData = [];
      this.pagination = {
        page: 1,
        pageSize: this.pagination.pageSize,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrevious: false,
      };
      this.selectedSale = null;
      this.selectedRowIndex = null;
    }
    },

    goToPreviousPage() {
      if (this.pagination.hasPrevious) {
        this.fetchSalesPage(this.pagination.page - 1);
      }
    },

    goToNextPage() {
      if (this.pagination.hasNext) {
        this.fetchSalesPage(this.pagination.page + 1);
      }
    },

    handleSelection(index, record) {
      this.selectedRowIndex = index;
      this.selectedSale = record;
      this.stockTransferSaleId = record?.id ?? null;
    },

    handleStockTransferVoucher() {
      if (!this.selectedSale || !this.selectedSale.id) {
        return;
      }
      this.stockTransferSaleId = this.selectedSale.id;
      this.showStockTransferModal = true;
    },

    closeStockTransferVoucher() {
      this.showStockTransferModal = false;
    },

    handleSalesInvoice() {
      if (!this.selectedSale) return;
      console.log('sales_invoice selected sale:', this.selectedSale);
      // TODO: replace with actual workflow
    },
    sortTable(tableName, column) {
      const table = this.forms[tableName];
      if (!table || !Array.isArray(table.data)) {
        return;
      }

      table.data = [...table.data].sort((a, b) => {
        const valueA = a[column];
        const valueB = b[column];

        if (valueA === null || valueA === undefined) return 1;
        if (valueB === null || valueB === undefined) return -1;

        if (!isNaN(valueA) && !isNaN(valueB)) {
          return Number(valueA) - Number(valueB);
        }

        const stringA = valueA.toString().toLowerCase();
        const stringB = valueB.toString().toLowerCase();

        if (stringA < stringB) return -1;
        if (stringA > stringB) return 1;
        return 0;
      });
    },
  },
}
</script>

<template>
  <!--<Card title="گزارش">-->
  <div class="relative w-full p-5">
    <!-- The div that should appear in front of all others -->
    <div class="fixed top-0 right-0 left-0 z-10 flex w-full flex-col">
      <template v-for="(alert, index) in alerts" :key="index">
        <Alert :msg="alert.message"></Alert>
      </template>
    </div>
    <div class="flex justify-end mb-4">
      <router-link
        to="/myapp/"
        type="button"
        class="block w-auto rounded-lg bg-gray-500 px-5 text-center text-sm font-medium text-white py-2.5 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
      >
        ← بازگشت به صفحه ی اصلی
      </router-link>
    </div>    
    <form class="mt-5 flex flex-col items-center gap-4">
      <template v-for="(val, tableName) in forms">
        <div class="relative h-auto w-full overflow-x-auto overflow-y-auto shadow-md max-h-[85vh] sm:rounded-lg">
          <table :id="tableName" class="w-full text-left rtl:text-right text-sm text-gray-500 dark:text-gray-400">
            <caption
                class="bg-white p-5 text-left rtl:text-right text-lg font-semibold text-gray-900 dark:bg-gray-800 dark:text-white">

              <div class="flex flex-row items-center gap-2">
                <template v-if="tableName == 'sales'">
                  <router-link
                      to="/myapp/invoicePage/"
                      type="button"
                      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
                  >
                    {{ val.title }}
                  </router-link>
                </template>
                <template v-else>
                  {{ val.title }}
                </template>
              </div>

            </caption>
            <thead class="bg-green-500 text-xs uppercase text-gray-100 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th class="w-16 px-1 py-3 text-center whitespace-nowrap">Select</th>
                <template v-for="column in val.fields" :key="column">
                  <template v-if="column !== 'id'">
                    <th scope="col" class="px-2 py-3" @click="sortTable(tableName, column)">
                      {{ column }}
                    </th>
                  </template>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, index) in val.data" :key="index" class="truncate border-b bg-white hover:bg-green-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600">
                <td class="p-4 text-center">
                  <input
                    type="radio"
                    name="selectedSale"
                    :value="index"
                    :checked="selectedRowIndex === index"
                    @change="handleSelection(index, v)"
                  />
                </td>
                <template v-for="field in val.fields" :key="field">
                  <template v-if="field !== 'id'">
                    <td class="w-4 p-4">
                      <template v-if="['total_price','unit_price','price_per_kg','net_weight'].includes(field)">
                        {{ v[field]?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}
                      </template>
                      <template v-else>
                        {{ v[field] }}
                      </template>
                    </td>
                  </template>
                </template>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 flex flex-col items-center gap-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="rounded bg-gray-500 px-4 py-2 text-sm text-white disabled:opacity-50"
                :disabled="!pagination.hasPrevious"
                @click="goToPreviousPage"
              >
                صفحه قبل
              </button>
              <span class="text-sm text-gray-700">
                صفحه {{ pagination.page }} از {{ pagination.totalPages }}
              </span>
              <button
                type="button"
                class="rounded bg-gray-500 px-4 py-2 text-sm text-white disabled:opacity-50"
                :disabled="!pagination.hasNext"
                @click="goToNextPage"
              >
                صفحه بعد
              </button>
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="rounded bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="!selectedSale || !selectedSale.id"
                @click="handleStockTransferVoucher"
              >
                حواله خروج انبار 
              </button>
              <button
                type="button"
                class="rounded bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                :disabled="!selectedSale"
                @click="handleSalesInvoice"
              >
                فاکتور فروش
              </button>
            </div>
          </div>
        </div>
      </template>
    </form>
    <stock-transfer-voucher
      :show="showStockTransferModal"
      :sale-id="stockTransferSaleId"
      @close="closeStockTransferVoucher"
    />
  </div>

</template>