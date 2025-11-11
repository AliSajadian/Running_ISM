<script>
import homayounLogo from '@/assets/logo.png'

export default {
  name: 'StockTransferVoucherModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    saleId: {
      type: [Number, String],
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      submitting: false,
      error: null,
      logoSrc: homayounLogo,
      logoDataUrl: '',
      gradeOptions: [
        'Test Linear Homayoun',
        'Kraft Linear Homayoun',
        'Whitetop Linear Homayoun',
        'Flutting Homayoun',
      ],
      customerOptions: [],
      form: {
        date: '',
        serialNumber: '',
        grade: '',
        gsm: '',
        width: '',
        customerName: '',
        quantity: '',
        netWeight: '',
        truckInfo: '',
      },
    }
  },
  watch: {
    show(val) {
      if (val) {
        this.initialize()
      } else {
        this.resetForm()
      }
    },
    saleId(val) {
      if (this.show && val) {
        this.initialize()
      }
    },
  },
  mounted() {
    this.prepareLogo()
  },
  methods: {
    async prepareLogo() {
      try {
        const url = this.getResolvedLogoUrl()
        if (!url) {
          return
        }
        const response = await fetch(url, { credentials: 'same-origin' })
        if (!response.ok) {
          return
        }
        const blob = await response.blob()
        const reader = new FileReader()
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        this.logoDataUrl = typeof dataUrl === 'string' ? dataUrl : ''
      } catch (error) {
        console.error('Failed to prepare logo for print preview:', error)
      }
    },
    getResolvedLogoUrl() {
      if (!this.logoSrc) {
        return ''
      }
      return this.logoSrc.startsWith('http')
        ? this.logoSrc
        : `${window.location.origin}${this.logoSrc}`
    },
    async initialize() {
      if (!this.saleId) {
        this.resetForm()
        return
      }
      this.error = null
      this.loading = true
      try {
        await this.loadVoucherData()
        await this.fetchCustomers()
      } catch (error) {
        console.error('Failed to load stock transfer voucher data:', error)
        this.error = 'خطا در دریافت اطلاعات حواله. لطفا دوباره تلاش کنید.'
      } finally {
        this.loading = false
      }
    },
    resetForm() {
      this.error = null
      this.loading = false
      this.submitting = false
      this.form = {
        date: this.form.date || this.getToday(),
        serialNumber: '',
        grade: this.gradeOptions[0],
        gsm: '',
        width: '',
        customerName: '',
        quantity: '',
        netWeight: '',
        truckInfo: '',
      }
    },
    getToday() {
      const now = new Date()
      return now.toLocaleDateString('fa-IR')
    },
    ensureOption(options, value) {
      if (value && !options.includes(value)) {
        options.unshift(value)
      }
    },
    async loadVoucherData() {
      const { data } = await this.axios.get('/myapp/api/getStockTransferVoucherData', {
        params: { sale_id: this.saleId },
      })

      const payload = data?.values || {}

      this.form.date = payload.stock_transfer_voucher_date || this.getToday()
      this.form.serialNumber = payload.stock_transfer_voucher_number || ''
      this.form.grade = payload.grade_from_product || this.gradeOptions[0]
      this.ensureOption(this.gradeOptions, this.form.grade)
      this.form.gsm = payload.gsm_from_product || ''
      this.form.width = payload.width || ''
      this.form.customerName = payload.customer_name || ''
      this.form.quantity = payload.quantity || ''
      this.form.netWeight = payload.net_weight || ''
      this.form.truckInfo = payload.stock_transfer_voucher_comment || ''
    },
    async fetchCustomers() {
      try {
        const { data } = await this.axios.get('/myapp/api/getCustomerNames')
        this.customerOptions = Array.isArray(data?.customer_names) ? [...data.customer_names] : []
        this.ensureOption(this.customerOptions, this.form.customerName)
      } catch (error) {
        console.error('Failed to load customer names:', error)
      }
    },
    closeModal() {
      this.$emit('close')
    },
    async handlePrint() {
      if (this.submitting) {
        return
      }

      if (!this.form.serialNumber) {
        this.error = 'لطفا شماره سریال را وارد کنید.'
        return
      }

      this.error = null
      this.submitting = true

      const payload = {
        date: this.form.date,
        serial_number: this.form.serialNumber,
        grade: this.form.grade,
        gsm: this.form.gsm,
        width: this.form.width,
        customer_name: this.form.customerName,
        quantity: this.form.quantity,
        net_weight: this.form.netWeight,
        truck_info: this.form.truckInfo,
      }

      try {
        await this.axios.post('/myapp/api/generateStockTransferVoucher', payload, {
          params: { sale_id: this.saleId },
        })
        this.openPrintPreview()
      } catch (error) {
        console.error('Failed to generate stock transfer voucher:', error)
        this.error = 'خطا در ایجاد فایل حواله. لطفا دوباره تلاش کنید.'
      } finally {
        this.submitting = false
      }
    },
    escapeHtml(value) {
      if (value === null || value === undefined) {
        return ''
      }
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    openPrintPreview() {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        this.error = 'مرورگر اجازه باز کردن صفحه چاپ را نداد. لطفا پاپ‌آپ‌ها را فعال کنید.'
        return
      }

      const logoUrl = this.logoDataUrl || this.getResolvedLogoUrl()
      const html = `<!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>چاپ حواله انبار</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; padding: 32px; background: #fff; }
            header { display: flex; flex-direction: row; justify-content: flex-start; align-items: flex-start; gap: 24px; margin-bottom: 10px; direction: ltr; }
            header .logo-wrapper { display: flex; align-items: flex-start; min-width: 180px; order: 1; }
            header .header-text { flex: 1; text-align: right; min-width: 320px; order: 2; }
            header h1 { font-size: 20px; margin: 0 0 4px 0; }
            header h2 { font-size: 18px; margin: 0 0 10px 0; }
            header .meta-line { font-size: 14px; margin-bottom: 4px; text-align: center; }
            header .logo { width: 180px; height: auto; object-fit: contain; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: center; font-size: 14px; }
            th { background: #f3f4f6; font-weight: bold; }
            tfoot td { font-weight: bold; }
            tfoot td:first-child,
            tfoot td:nth-child(2),
            tfoot td:nth-child(3),
            tfoot td:nth-child(4) { text-align: right; }
            tfoot td:nth-child(2) { padding-right: 12px; }
            .footer { display: flex; justify-content: space-between; font-size: 14px; margin-top: 48px; }
            .ack { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 32px; font-size: 14px; }
            .ack .receiver-placeholder { display: inline-block; min-width: 220px; height: 18px; }
          </style>
        </head>
        <body>
          <header>
            <div class="logo-wrapper">
              ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Homayoun Logo" />` : ''}
            </div>
            <div class="header-text">
              <h1>شرکت صنایع تولیدی کاغذ و مقوای همایون</h1>
              <h2>حواله خروج از انبار</h2>
              <div class="meta-line">تاریخ ارسال : ${this.escapeHtml(this.form.date)}</div>
              <div class="meta-line">شماره سریال : ${this.escapeHtml(this.form.serialNumber)}</div>
            </div>
          </header>
          <table>
            <thead>
              <tr>
                <th>ردیف</th>
                <th>نام کالا و مشخصات کالا</th>
                <th>گرماز</th>
                <th>عرض کالا</th>
                <th>نام خریدار</th>
                <th>تعداد / مقدار</th>
                <th>وزن کالا</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${this.escapeHtml(this.form.grade)}</td>
                <td>${this.escapeHtml(this.form.gsm)}</td>
                <td>${this.escapeHtml(this.form.width)}</td>
                <td>${this.escapeHtml(this.form.customerName)}</td>
                <td>${this.escapeHtml(this.form.quantity)}</td>
                <td>${this.escapeHtml(this.form.netWeight)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="note-row">
                <td>ملاحظات</td>
                <td colspan="3">${this.escapeHtml(this.form.truckInfo)}</td>
                <td>جمع</td>
                <td></td>
                <td>${this.escapeHtml(this.form.netWeight)}</td>
              </tr>
            </tfoot>
          </table>
          <div class="footer">
            <span>حسابداری</span>
            <span>انبارداری</span>
            <span>مدیر فروش</span>
            <span>مدیریت کارخانه</span>
            <span>تحویل گیرنده</span>
          </div>
          <div class="ack">
            <span>بار صحیح و سالم تحویل اینجانب</span>
            <span class="receiver-placeholder"></span>
            <span>گردید</span>
          </div>
          <script>
            window.addEventListener('load', function () {
              window.focus()
              window.print()
              window.close()
            })
          <\/script>
        </body>
        </html>`

      printWindow.document.open()
      printWindow.document.write(html)
      printWindow.document.close()
    },
  },
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
    <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">حواله خروج انبار</h2>
        <button
          type="button"
          class="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-300"
          @click="closeModal"
        >
          ×
        </button>
      </div>

      <div v-if="error" class="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800">
        {{ error }}
      </div>

      <div v-if="loading" class="py-10 text-center text-gray-500">
        در حال بارگذاری اطلاعات...
      </div>

      <div v-else class="space-y-4">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">تاریخ</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.date"
              disabled
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">شماره سریال</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.serialNumber"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">مشخصات</label>
            <select
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.grade"
            >
              <option v-for="option in gradeOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">گرماز</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.gsm"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">عرض کالا</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.width"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">نام خریدار</label>
            <select
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.customerName"
            >
              <option value="" disabled>انتخاب مشتری</option>
              <option v-for="option in customerOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">تعداد / مقدار</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.quantity"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">وزن کالا</label>
            <input
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              v-model="form.netWeight"
            />
          </div>
          <div class="md:col-span-2 flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">ملاحظات</label>
            <textarea
              class="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              v-model="form.truckInfo"
              maxlength="100"
              rows="3"
              disabled
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            @click="closeModal"
          >
            انصراف
          </button>
          <button
            type="button"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            :disabled="submitting || loading"
            @click="handlePrint"
          >
            <span v-if="submitting">در حال آماده‌سازی...</span>
            <span v-else>چاپ حواله انبار</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
